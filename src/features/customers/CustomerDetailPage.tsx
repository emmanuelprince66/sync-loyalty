import { formatActivityDate } from "@/api/http";
import { useCardColour } from "@/api/storeTheme";
import { LoyaltyCardSkeleton } from "@/components/ui/CardSkeleton";
import { LoyaltyCard } from "@/components/ui/LoyaltyCard";
import {
  Card,
  EmptyBlock,
  ErrorBlock,
  MkButton,
  initialsOf,
} from "@/components/ui/mk";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useBusinessDataStore } from "@/stores/business-data-store";
import {
  ArrowLeft,
  Check,
  PenLine,
  ScanLine,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { CustomerFormModal } from "./components/CustomerFormModal";
import { DeleteCustomerModal } from "./components/DeleteCustomerModal";
import { useCustomerDetail } from "./hooks/useCustomerDetail";

export default function CustomerDetailPage() {
  const page = useCustomerDetail();
  const businessName =
    useBusinessDataStore((state) => state.businessData?.name) ||
    "Your business";
  const cardColour = useCardColour();
  const c = page.customer;
  return (
    <div className="space-y-5">
      <div className="mb-2">
        <button
          type="button"
          onClick={page.back}
          className="text-xs font-extrabold"
        >
          <ArrowLeft className="mr-2 inline" size={14} />
          Back to customers
        </button>
      </div>
      {page.isError ? (
        <Card>
          <ErrorBlock
            text="We couldn’t load this customer."
            onRetry={page.retry}
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
          <div className="min-w-0 space-y-5">
            <Card className="bg-black p-6 text-white">
              {page.isLoading || !c ? (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 animate-pulse rounded-full bg-white/15" />
                  <div className="h-6 w-48 animate-pulse bg-white/15" />
                </div>
              ) : (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#D7FF45] text-lg font-black text-black">
                      {initialsOf(c.name)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-black">{c.name}</h2>
                      <p className="mt-1 truncate text-xs text-white/45">
                        {[page.code, c.phone, page.tier]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {page.canEdit && (
                      <button
                        type="button"
                        onClick={page.edit}
                        aria-label="Edit customer"
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/20"
                      >
                        <PenLine size={15} />
                      </button>
                    )}
                    {page.canDelete && (
                      <button
                        type="button"
                        onClick={page.askDelete}
                        aria-label="Delete customer"
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-7 grid grid-cols-3 gap-3">
                {(page.stats.length
                  ? page.stats
                  : [
                      { label: "", value: "" },
                      { label: " ", value: "" },
                      { label: "  ", value: "" },
                    ]
                ).map((stat) => (
                  <div key={stat.label} className="min-w-0">
                    <p className="text-[9px] uppercase text-white/40">
                      {stat.label}
                    </p>
                    {stat.value ? (
                      <b className="block truncate">{stat.value}</b>
                    ) : (
                      <div className="mt-1 h-5 w-16 animate-pulse bg-white/15" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-black">Activity timeline</h3>
              {page.activityLoading ? (
                <TableSkeleton
                  header={false}
                  rows={4}
                  className="mt-3 -mx-5"
                  columns={[
                    { thumbnail: true, flex: true, twoLine: true },
                    { width: "w-16", alignRight: true },
                  ]}
                />
              ) : page.activity.length === 0 ? (
                <EmptyBlock
                  title="No activity yet"
                  text="Purchases, wallet top-ups and rewards show here."
                />
              ) : (
                <div className="mt-5 space-y-5">
                  {page.activity.map((item, index) => (
                    <div key={item.id} className="flex gap-3">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-[#D7FF45]" : "bg-[#EFEFEC]"}`}
                      >
                        {index === 0 ? (
                          <ShoppingBag size={13} />
                        ) : (
                          <Check size={13} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold">
                          {item.title} · {item.amount}
                        </p>
                        <p className="mt-1 text-[9px] text-black/40">
                          {formatActivityDate(item.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <div>
            {page.walletLoading ? (
              <LoyaltyCardSkeleton />
            ) : page.wallet ? (
              <LoyaltyCard
                wallet={page.wallet}
                businessName={businessName}
                colour={cardColour}
              />
            ) : (
              <Card className="p-5">
                <p className="text-sm font-black">Not a loyalty member yet</p>
                <p className="mt-1 text-xs text-black/45">
                  Share a program’s join QR so{" "}
                  {c?.name.split(" ")[0] || "this customer"} can sign up.
                </p>
              </Card>
            )}
            {page.wallet && page.canScan && (
              <MkButton onClick={page.checkIn} className="mt-3 w-full">
                <ScanLine size={15} />
                Check in customer
              </MkButton>
            )}
          </div>
        </div>
      )}
      <CustomerFormModal
        open={page.editing}
        customer={c}
        onClose={page.closeEdit}
      />
      <DeleteCustomerModal
        customer={page.confirmDelete ? c : null}
        deleting={page.deleting}
        onCancel={page.cancelDelete}
        onConfirm={page.remove}
      />
    </div>
  );
}
