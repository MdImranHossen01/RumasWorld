'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Trash2,
  Search,
  Download,
  Calendar,
  Users,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/subscribers');
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch {
      toast.error('Failed to load subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This subscriber will be removed permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/subscribers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (res.ok) {
          toast.success('Subscriber removed');
          setSubscribers(subscribers.filter((s) => s._id !== id));
        } else {
          toast.error('Failed to delete');
        }
      } catch {
        toast.error('Something went wrong');
      }
    }
  };

  const filteredSubscribers = subscribers.filter((s) =>
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStoreDisplayName = () => {
    if (process.env.NEXT_PUBLIC_STORE_NAME) return process.env.NEXT_PUBLIC_STORE_NAME;
    if (typeof window !== 'undefined') {
      return window.location.hostname.replace(/^www\./, '');
    }
    return 'Our Store';
  };

  const handleSendEmail = (email?: string) => {
    if (!email || !email.includes('@')) {
      toast.error('Invalid email address');
      return;
    }
    const storeName = getStoreDisplayName();
    const subject = encodeURIComponent(`Newsletter Update from ${storeName}`);
    const body = encodeURIComponent(`Hello,\n\n\n\nBest regards,\n${storeName}`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.trim())}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBulkSendEmail = () => {
    const listToEmail = filteredSubscribers.length > 0 ? filteredSubscribers : subscribers;
    const validEmails = Array.from(
      new Set(
        listToEmail
          .map((s) => (s.email || '').trim())
          .filter((em) => em && em.includes('@'))
      )
    );
    if (validEmails.length === 0) {
      toast.error('No subscribers available to email');
      return;
    }
    const storeName = getStoreDisplayName();
    const subject = encodeURIComponent(`Newsletter Update from ${storeName}`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(validEmails.join(','))}&su=${subject}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyEmail = async (email?: string) => {
    if (!email) {
      toast.error('No email address available');
      return;
    }
    try {
      await navigator.clipboard.writeText(email.trim());
      toast.success('Email address copied to clipboard');
    } catch {
      toast.error('Failed to copy email address');
    }
  };

  const exportCSV = () => {
    const listToExport = filteredSubscribers.length > 0 ? filteredSubscribers : subscribers;
    if (listToExport.length === 0) {
      toast.error('No subscribers available to export');
      return;
    }
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['Email Address', 'Subscribed Date'];
    const rows = listToExport.map((s) =>
      [
        escapeCsv(s.email || ''),
        escapeCsv(s.createdAt ? format(new Date(s.createdAt), 'yyyy-MM-dd hh:mm a') : ''),
      ].join(',')
    );

    const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${listToExport.length} subscribers to CSV`);
  };

  return (
    <div className="px-0 py-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Newsletter Subscribers
          </h1>
          <p className="text-muted-foreground">Manage your store&apos;s email subscription list.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleBulkSendEmail}
            disabled={subscribers.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Mail className="h-4 w-4" /> Send Email to All
          </Button>
          <Button
            onClick={exportCSV}
            disabled={subscribers.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{subscribers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredSubscribers.length} of {subscribers.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Email Address</TableHead>
                  <TableHead>Subscribed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-48 rounded" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-28 rounded" /></TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground font-medium">
                      No subscribers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Mail className="h-4 w-4" />
                          </div>
                          {subscriber.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(subscriber.createdAt), 'MMM dd, yyyy • hh:mm a')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-primary/10 hover:text-primary h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1.5">
                                Subscriber Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleSendEmail(subscriber.email)}
                                className="cursor-pointer text-xs font-medium"
                              >
                                <Mail className="mr-2 h-3.5 w-3.5 text-primary" /> Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCopyEmail(subscriber.email)}
                                className="cursor-pointer text-xs"
                              >
                                <Copy className="mr-2 h-3.5 w-3.5" /> Copy Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(subscriber._id)}
                                className="text-destructive cursor-pointer font-bold focus:bg-destructive/10 focus:text-destructive mt-1 text-xs"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Subscriber
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
