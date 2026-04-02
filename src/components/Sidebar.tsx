import { NavLink } from "react-router";

const links = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/accounts", label: "Accounts", icon: AccountsIcon },
  { to: "/transactions", label: "Transactions", icon: TransactionsIcon },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="flex h-14 items-center gap-2 px-4">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">hledger</span>
        <span className="text-sm text-gray-400">web</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 pt-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 001 4.5v4A1.5 1.5 0 002.5 10h6A1.5 1.5 0 0010 8.5v-4A1.5 1.5 0 008.5 3h-6zm11 2A1.5 1.5 0 0012 6.5v7a1.5 1.5 0 001.5 1.5h4A1.5 1.5 0 0019 13.5v-7A1.5 1.5 0 0017.5 5h-4zm-13 5A1.5 1.5 0 00-.5 11.5v4A1.5 1.5 0 001 17h6a1.5 1.5 0 001.5-1.5v-4A1.5 1.5 0 007 10H1z" clipRule="evenodd" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0117.25 17H2.75A1.75 1.75 0 011 15.25V4.75zM2.75 4.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h14.5a.25.25 0 00.25-.25V4.75a.25.25 0 00-.25-.25H2.75z" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h11.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.5A.75.75 0 012.75 7.5h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 8.25zm0 4.5a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  );
}
