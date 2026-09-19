import React from 'react';
import { X, Clock, Play, Trash2, ShoppingCart, User, AlertCircle } from 'lucide-react';
import type { Customer, CartItem } from '../../types';
import { useSystemSettings } from '../../contexts/SettingsContext';

export interface HeldTicket {
  id: string;
  heldAt: string;
  note?: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
}

interface HeldTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: HeldTicket[];
  onResumeTicket: (ticket: HeldTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
}

export const HeldTicketsModal: React.FC<HeldTicketsModalProps> = ({
  isOpen,
  onClose,
  tickets,
  onResumeTicket,
  onDeleteTicket,
}) => {
  const { formatPrice } = useSystemSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Suspended POS Tickets</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} on hold at this terminal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Tickets on Hold</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                When a customer needs time to consult their mechanic or fetch additional details, use "Hold Ticket" in the cart to suspend the transaction.
              </p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const totalItemsCount = ticket.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={ticket.id}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          {ticket.id}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ticket.heldAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        <span className="font-semibold">{ticket.customer.name}</span>
                        {ticket.customer.companyName && (
                          <span className="text-slate-400">({ticket.customer.companyName})</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 uppercase">
                          {ticket.customer.tier}
                        </span>
                      </div>

                      {ticket.note && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40 mt-1.5 font-medium">
                          Note: {ticket.note}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white block">
                        {formatPrice(ticket.subtotal)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {totalItemsCount} {totalItemsCount === 1 ? 'part' : 'parts'}
                      </span>
                    </div>
                  </div>

                  {/* Items snapshot */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-mono border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                    {ticket.items.map((it) => `${it.quantity}x ${it.sku || it.name}`).join(' • ')}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => onDeleteTicket(ticket.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Discard Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onResumeTicket(ticket)}
                      className="py-1.5 px-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Sale</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-750 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
