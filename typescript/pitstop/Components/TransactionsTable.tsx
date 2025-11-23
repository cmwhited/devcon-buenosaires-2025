"use client"

import { User } from "@privy-io/react-auth"
import { eq, inArray, useLiveQuery } from "@tanstack/react-db"
import Link from "next/link"

import { transactionCollection } from "@/collections/transactions"
import { classnames } from "@/utils/classnames"

export function TransactionsTable({ user }: Readonly<{ user: User }>) {
  const accounts = user.linkedAccounts
    .filter((acct) => acct.type === "wallet" || acct.type === "smart_wallet")
    .map((acct) => acct.address)
  const {
    data: transactions,
    isLoading,
    isError,
  } = useLiveQuery((q) =>
    q
      .from({ tx: transactionCollection })
      .where(({ tx }) => inArray(tx.to, accounts))
      .orderBy(({ tx }) => tx.block_num, { direction: "desc" }),
  )

  if (isLoading) {
    return <TableSkeleton />
  } else if (isError) {
    return <div>Failure fetching transactions :(. Please try again</div>
  }

  if (transactions.length === 0) {
    return (
      <div className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-center text-center text-base font-semibold whitespace-break-spaces text-(--color-oil-black)">
        You haven’t gassed up yet.
        <br />
        Completed transactions will appear here.
      </div>
    )
  }

  return (
    <div className="mt-8 flex flex-col gap-y-4">
      <h5 className="text-xl font-semibold text-(--color-oil-black)">Transaction History</h5>
      <div className="flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden bg-[#2D2D2D] shadow-sm outline-1 outline-(--color-oil-gray) sm:rounded-xs">
              <table className="relative min-w-full divide-y divide-(--color-oil-black)">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="text-status-pending py-3.5 pr-3 pl-4 text-left text-sm font-semibold uppercase sm:pl-6"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="text-status-pending px-3 py-3.5 text-left text-sm font-semibold uppercase"
                    >
                      Block#
                    </th>
                    <th
                      scope="col"
                      className="text-status-pending px-3 py-3.5 text-left text-sm font-semibold uppercase"
                    >
                      From
                    </th>
                    <th
                      scope="col"
                      className="text-status-pending px-3 py-3.5 text-left text-sm font-semibold uppercase"
                    >
                      To
                    </th>
                    <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-6">
                      <span className="sr-only">View on block explorer</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2D2D]">
                  {transactions.map((tx) => (
                    <tr key={tx.tx_hash}>
                      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 dark:text-white">
                        {`${tx.timestamp.toLocaleDateString()} @ ${tx.timestamp.toLocaleTimeString()}`}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {tx.block_num}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {tx.from}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{tx.to}</td>
                      <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                        <Link
                          href={`https://base-sepolia.blockscout.com/tx/${tx.tx_hash}`}
                          target="_blank"
                          className="text-(--color-neon-green) hover:underline"
                        >
                          View<span className="sr-only">, {tx.tx_hash}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full px-4 py-2 align-middle">
          <table className="relative min-w-full divide-y divide-(--color-oil-black)">
            <thead>
              <tr className="divide-x divide-(--color-oil-black)">
                {[...Array(4)].map((_, idx) => (
                  <th key={idx} scope="col" className={classnames("p-2", idx === 0 ? "pr-3 pl-4 sm:pl-0" : "px-3")}>
                    <div className="rounded-4 h-5 w-20 bg-(--dirty-white)" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-oil-black)">
              {[...Array(3)].map((_, rowIdx) => (
                <tr key={rowIdx} className="divide-x divide-(--color-oil-black)">
                  {[...Array(4)].map((_, colIdx) => (
                    <td key={colIdx} className={classnames("py-2", colIdx === 0 ? "pr-3 pl-4 sm:pl-0" : "px-3")}>
                      <div className="rounded-4 h-4 w-24 animate-pulse bg-(--dirty-white)" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
