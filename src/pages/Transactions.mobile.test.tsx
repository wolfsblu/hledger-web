import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useState } from "react";

const txn = {
  index: 1,
  date: "2026-01-15",
  description: "Grocery shopping",
  status: "cleared",
  postings: [
    {
      account: "expenses:food",
      amount: [{ quantity: -42.5, commodity: "EUR" }],
      status: "cleared",
    },
  ],
  comment: "",
  tags: [],
};

type TxnFixture = typeof txn;

function TestRow({ txn }: { txn: TxnFixture }) {
  const [expanded, setExpanded] = useState(false);
  const p = txn.postings[0];
  const qty = p.amount[0].quantity;
  return (
    <div>
      <div data-testid="row" onClick={() => setExpanded(e => !e)}>
        <span data-testid="description">{txn.description}</span>
        <span data-testid="amount">{qty}</span>
        <span data-testid="date">{txn.date}</span>
        <span data-testid="account">{p.account}</span>
      </div>
      {expanded && <div data-testid="detail">detail</div>}
    </div>
  );
}

describe("MobileLedgerRow behavior", () => {
  it("renders description, amount, date, account", () => {
    render(<TestRow txn={txn} />);
    expect(screen.getByTestId("description")).toHaveTextContent("Grocery shopping");
    expect(screen.getByTestId("date")).toHaveTextContent("2026-01-15");
    expect(screen.getByTestId("account")).toHaveTextContent("expenses:food");
  });

  it("does not show detail by default", () => {
    render(<TestRow txn={txn} />);
    expect(screen.queryByTestId("detail")).not.toBeInTheDocument();
  });

  it("shows detail after tap", () => {
    render(<TestRow txn={txn} />);
    fireEvent.click(screen.getByTestId("row"));
    expect(screen.getByTestId("detail")).toBeInTheDocument();
  });

  it("collapses detail on second tap", () => {
    render(<TestRow txn={txn} />);
    fireEvent.click(screen.getByTestId("row"));
    fireEvent.click(screen.getByTestId("row"));
    expect(screen.queryByTestId("detail")).not.toBeInTheDocument();
  });
});
