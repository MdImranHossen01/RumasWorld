"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Users,
  Image as ImageIcon,
  Settings,
  Mail,
  CreditCard,
  RotateCcw,
  Truck,
  Landmark,
  BarChart3,
  LogOut,
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      tKey: "sidebar.dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          tKey: "sidebar.overview",
          url: "/admin/dashboard",
        },
        {
          title: "Notifications",
          tKey: "sidebar.notifications",
          url: "/admin/notifications",
        },
      ],
    },
    {
      title: "Product Management",
      tKey: "sidebar.product_management",
      url: "#",
      icon: ShoppingBag,
      items: [
        {
          title: "All Products",
          tKey: "sidebar.all_products",
          url: "/admin/products",
        },
        {
          title: "Add Product",
          tKey: "sidebar.add_product",
          url: "/admin/products/new",
        },
        {
          title: "Upcoming Expire",
          tKey: "sidebar.upcoming_expire",
          url: "/admin/upcoming-expiry",
        },
        {
          title: "Low Stock",
          tKey: "sidebar.low_stock",
          url: "/admin/low-stock",
        },
        {
          title: "Categories",
          tKey: "sidebar.categories",
          url: "/admin/categories",
        },
        {
          title: "Brands",
          tKey: "sidebar.brands",
          url: "/admin/brands",
        },
      ],
    },
    {
      title: "Product Return",
      tKey: "sidebar.product_return",
      url: "#",
      icon: RotateCcw,
      items: [
        {
          title: "New Return",
          tKey: "sidebar.new_return",
          url: "/admin/returns/new",
        },
        {
          title: "Return List",
          tKey: "sidebar.return_list",
          url: "/admin/returns",
        },
      ],
    },
    {
      title: "Sales & Orders",
      tKey: "sidebar.sales_orders",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "All Orders",
          tKey: "sidebar.all_orders",
          url: "/admin/orders",
        },
        {
          title: "Abandoned Carts",
          tKey: "sidebar.abandoned_carts",
          url: "/admin/abandoned-carts",
        },
        {
          title: "Offers / Quotations",
          tKey: "sidebar.offers_quotations",
          url: "/admin/offers",
        },
        {
          title: "Delivery Challans",
          tKey: "sidebar.delivery_challans",
          url: "/admin/chalans",
        },
        {
          title: "Client Bills",
          tKey: "sidebar.client_bills",
          url: "/admin/bills",
        },
        {
          title: "Create Invoice",
          tKey: "sidebar.create_invoice",
          url: "/admin/bills/create",
        },
      ],
    },
    {
      title: "Suppliers & Purchases",
      tKey: "sidebar.suppliers",
      url: "#",
      icon: Truck,
      items: [
        {
          title: "Suppliers / Vendors",
          tKey: "sidebar.suppliers_vendors",
          url: "/admin/suppliers",
        },
        {
          title: "Supplier Bills",
          tKey: "sidebar.supplier_bills",
          url: "/admin/supplier-bills",
        },
      ],
    },
    {
      title: "Loan",
      tKey: "sidebar.loan",
      url: "#",
      icon: Landmark,
      items: [
        {
          title: "Add Loan Provider",
          tKey: "sidebar.add_loan_provider",
          url: "/admin/loans/providers/new",
        },
        {
          title: "All Loan Providers",
          tKey: "sidebar.all_loan_providers",
          url: "/admin/loans/providers",
        },
        {
          title: "All Loans",
          tKey: "sidebar.all_loans",
          url: "/admin/loans",
        },
        {
          title: "Upcoming Payable",
          tKey: "sidebar.upcoming_payable",
          url: "/admin/loans/upcoming",
        },
      ],
    },
    {
      title: "Ledger & Accounting",
      tKey: "sidebar.ledger_accounting",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "All Accounts",
          tKey: "sidebar.all_accounts",
          url: "/admin/accounts",
        },
        {
          title: "Add Account",
          tKey: "sidebar.add_account",
          url: "/admin/accounts/new",
        },
        {
          title: "Expenses & Incomes",
          tKey: "sidebar.expenses_incomes",
          url: "/admin/expenses-incomes",
        },
        {
          title: "Add New Entry",
          tKey: "sidebar.add_expense_income",
          url: "/admin/expenses-incomes?action=new",
        },
        {
          title: "Category",
          tKey: "sidebar.add_category",
          url: "/admin/expenses-incomes/categories",
        },

        {
          title: "Accounts Ledger",
          tKey: "sidebar.accounts_ledger",
          url: "/admin/ledger"
        },
        {
          title: "Account Receivable",
          tKey: "sidebar.account_receivable",
          url: "/admin/ledger/receivable"
        },
        {
          title: "Account Payable",
          tKey: "sidebar.account_payable",
          url: "/admin/ledger/payable"
        },
      ],
    },
    {
      title: "Reports & Analytics",
      tKey: "sidebar.reports_analytics",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Daily Report",
          tKey: "sidebar.daily_report",
          url: "/admin/reports/daily",
        },
        {
          title: "Monthly Report",
          tKey: "sidebar.monthly_report",
          url: "/admin/reports/monthly",
        },
        {
          title: "Order Profit Report",
          tKey: "sidebar.order_profit_report",
          url: "/admin/reports/order-profit",
        },
        {
          title: "Item Profit Report",
          tKey: "sidebar.item_profit_report",
          url: "/admin/reports/item-profit",
        },
        {
          title: "Top & Low Sales",
          tKey: "sidebar.top_low_sales",
          url: "/admin/reports/product-sales",
        },
        {
          title: "Brand Wise Sales",
          tKey: "sidebar.brand_wise_sales",
          url: "/admin/reports/brand-sales",
        },
        {
          title: "Purchase Report",
          tKey: "sidebar.purchase_report",
          url: "/admin/reports/purchase",
        },
        {
          title: "Expense Report",
          tKey: "sidebar.expense_report",
          url: "/admin/reports/expense",
        },
      ],
    },
    {
      title: "Customer Management",
      tKey: "sidebar.customer_management",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Users",
          tKey: "sidebar.all_users",
          url: "/admin/users"
        },
        {
          title: "System Users",
          tKey: "sidebar.system_users",
          url: "/admin/system-users"
        },
        {
          title: "Areas",
          tKey: "sidebar.areas",
          url: "/admin/areas",
        },
      ],
    },
    {
      title: "CMS Manager",
      tKey: "sidebar.cms_manager",
      url: "#",
      icon: ImageIcon,
      items: [
        {
          title: "Banners",
          tKey: "sidebar.banners",
          url: "/admin/cms/banners",
        },
        {
          title: "Landing Pages",
          tKey: "sidebar.landing_pages",
          url: "/admin/landing-pages",
        },
        {
          title: "Testimonials",
          tKey: "sidebar.testimonials",
          url: "/admin/cms/testimonials",
        },
        {
          title: "FAQs",
          tKey: "sidebar.faqs",
          url: "/admin/cms/faqs",
        },
      ],
    },
    {
      title: "Blogs",
      tKey: "sidebar.blogs",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Manage Blog",
          tKey: "sidebar.manage_blog",
          url: "/admin/blogs",
        },
        {
          title: "Add New Blog",
          tKey: "sidebar.add_new_blog",
          url: "/admin/blogs/new",
        },
      ],
    },
    {
      title: "System Settings",
      tKey: "sidebar.system_settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Coupons",
          tKey: "sidebar.coupons",
          url: "/admin/coupons",
        },
        {
          title: "General Settings",
          tKey: "sidebar.general_settings",
          url: "/admin/settings",
        },
        {
          title: "Profile",
          tKey: "sidebar.profile",
          url: "/admin/settings/profile",
        },
        {
          title: "Marketing Settings",
          tKey: "sidebar.marketing_settings",
          url: "/admin/marketing",
        },
        {
          title: "Subscribers",
          tKey: "sidebar.subscribers",
          url: "/admin/subscribers",
          icon: Mail,
        },
        {
          title: "Infrastructure & Marketing",
          tKey: "sidebar.infrastructure_marketing",
          url: "/admin/system-design",
          superOnly: true
        },
      ],
    },
  ],
}


import { useLanguage } from "@/contexts/LanguageContext"

function isUrlActive(
  itemUrl: string,
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams> | null,
  allSiblingUrls: string[] = []
): boolean {
  if (!itemUrl || itemUrl === "#") return false;

  const [itemPath, itemQuery] = itemUrl.split("?");

  if (itemQuery) {
    if (pathname !== itemPath) return false;
    if (!searchParams) return false;

    const itemSearchParams = new URLSearchParams(itemQuery);
    for (const [key, val] of itemSearchParams.entries()) {
      if (searchParams.get(key) !== val) {
        return false;
      }
    }
    return true;
  } else {
    const pathMatches =
      pathname === itemPath ||
      (itemPath !== "/admin" &&
        pathname.startsWith(itemPath + "/") &&
        !allSiblingUrls.some(
          (other) =>
            other !== itemUrl &&
            other.length > itemUrl.length &&
            (pathname === other || pathname.startsWith(other + "/"))
        ));

    if (!pathMatches) return false;

    if (searchParams && searchParams.toString().length > 0) {
      const moreSpecificSiblingMatches = allSiblingUrls.some((siblingUrl) => {
        if (!siblingUrl.includes("?")) return false;
        const [sibPath, sibQuery] = siblingUrl.split("?");
        if (sibPath !== pathname) return false;
        const sibSearchParams = new URLSearchParams(sibQuery);
        for (const [key, val] of sibSearchParams.entries()) {
          if (searchParams.get(key) !== val) return false;
        }
        return true;
      });

      if (moreSpecificSiblingMatches) {
        return false;
      }
    }

    return true;
  }
}

function NavMainCollapsibleItem({
  item,
  pathname,
  searchParams,
  handleItemClick,
}: {
  item: any;
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams> | null;
  handleItemClick: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void;
}) {
  const { t } = useLanguage()
  const siblingUrls = item.items.map((subItem: any) => subItem.url);
  const isParentActive =
    item.items.some((subItem: any) =>
      isUrlActive(subItem.url, pathname, searchParams, siblingUrls)
    ) || isUrlActive(item.url, pathname, searchParams, []);

  const [isOpen, setIsOpen] = React.useState(isParentActive);
  const [prevIsParentActive, setPrevIsParentActive] = React.useState(isParentActive);

  if (isParentActive !== prevIsParentActive) {
    setPrevIsParentActive(isParentActive);
    if (isParentActive) {
      setIsOpen(true);
    }
  }

  const parentLabel = t(item.tKey as string) || item.title;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={parentLabel}
              isActive={isParentActive}
              className={`h-10 rounded-xl px-3 transition-all duration-200 ${
                isParentActive
                  ? "!bg-primary !text-white font-bold shadow-md shadow-primary/30 data-active:!bg-primary data-active:!text-white data-[active=true]:!bg-primary data-[active=true]:!text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            />
          }
        >
          {item.icon && <item.icon className={`h-5 w-5 shrink-0 ${isParentActive ? "!text-white" : "text-slate-300"}`} />}
          <span className={`text-sm font-medium tracking-tight ml-1.5 ${isParentActive ? "!text-white font-bold" : "text-slate-200"}`}>
            {parentLabel}
          </span>
          <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-open/collapsible:rotate-90 group-[[data-state=open]]/collapsible:rotate-90 ${isParentActive ? "!text-white opacity-90" : "text-slate-400 opacity-70"}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-4 pl-2 border-l border-slate-800/80 my-1 space-y-1">
            {item.items.map((subItem: any) => {
              const isSubActive = isUrlActive(subItem.url, pathname, searchParams, siblingUrls);
              const subLabel = subItem.tKey ? t(subItem.tKey as string) : subItem.title;

              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    render={<Link href={subItem.url} onClick={(e) => handleItemClick(e, subItem.url)} />}
                    isActive={isSubActive}
                    className={`h-8 rounded-lg px-3 text-xs transition-all duration-150 ${
                      isSubActive
                        ? "!bg-primary !text-white font-bold shadow-sm data-active:!bg-primary data-active:!text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span className={isSubActive ? "!text-white font-bold" : ""}>{subLabel}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavMain({
  items,
  pathname,
  searchParams,
  role,
}: {
  items: typeof data.navMain;
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams> | null;
  role?: string;
}) {
  const { setOpenMobile, isMobile } = useSidebar()

  // Filter items based on role
  const filteredItems = items.map(item => ({
    ...item,
    items: item.items.filter((subItem: any) => {
      if (subItem.superOnly && role !== 'super_admin') return false;
      return true;
    })
  })).filter(item => item.items.length > 0);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url === '/admin/expenses-incomes?action=new') {
      e.preventDefault();
      window.dispatchEvent(new Event('open-transaction-dialog'));
      if (isMobile) {
        setOpenMobile(false);
      }
    } else {
      handleLinkClick();
    }
  }

  return (
    <SidebarGroup className="py-2">
      <SidebarMenu className="gap-1">
        {filteredItems.map((item) => (
          <NavMainCollapsibleItem
            key={item.title}
            item={item}
            pathname={pathname}
            searchParams={searchParams}
            handleItemClick={handleItemClick}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavMainWithSearchParams({
  items,
  pathname,
  role,
}: {
  items: typeof data.navMain;
  pathname: string;
  role?: string;
}) {
  const searchParams = useSearchParams();
  return <NavMain items={items} pathname={pathname} searchParams={searchParams} role={role} />;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const user = session?.user

  return (
    <Sidebar
      {...props}
      className="border-r border-slate-800/80 bg-[#0a152e] text-slate-100 [&_[data-slot=sidebar-inner]]:bg-[#0a152e] [&_[data-slot=sidebar-inner]]:text-slate-100"
    >
      <SidebarHeader className="border-b border-slate-800/80 h-14 px-3 flex flex-row items-center justify-center bg-[#0a152e]">
        <Logo
          href="/"
          className="flex items-center justify-center gap-2.5 w-full mx-auto"
          imageClassName="!size-8 shrink-0 rounded-md"
          textClassName="!text-lg md:!text-xl font-black tracking-tight font-logo truncate max-w-[190px] text-white group-hover:text-white group-data-[collapsible=icon]:hidden"
        />
      </SidebarHeader>

      <SidebarContent className="gap-0 bg-[#0a152e] scrollbar-thin scrollbar-thumb-slate-800">
        <React.Suspense fallback={<NavMain items={data.navMain} pathname={pathname} searchParams={null} role={role} />}>
          <NavMainWithSearchParams items={data.navMain} pathname={pathname} role={role} />
        </React.Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800/80 p-3 bg-[#081024]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 border border-slate-700">
              <AvatarImage src={user?.image || ""} alt={user?.name || "Admin"} />
              <AvatarFallback className="bg-primary text-white font-bold text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.name || "Admin User"}</p>
              <p className="text-[10px] text-slate-400 capitalize">{role ? role.replace('_', ' ') : "Administrator"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

