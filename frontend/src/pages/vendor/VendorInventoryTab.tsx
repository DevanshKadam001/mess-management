import React, { useState, useEffect } from 'react';
import { Ingredient, InventoryTransaction } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  Plus,
  ArrowUpRight,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Trash2,
  Edit,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const VendorInventoryTab: React.FC = () => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterLowStock, setFilterLowStock] = useState<boolean>(false);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [restockModalOpen, setRestockModalOpen] = useState<boolean>(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('10');
  const [unit, setUnit] = useState<string>('kg');
  const [minThreshold, setMinThreshold] = useState<string>('3');
  const [costPerUnit, setCostPerUnit] = useState<string>('50');

  // Restock form
  const [restockAmount, setRestockAmount] = useState<string>('5');
  const [restockNote, setRestockNote] = useState<string>('');

  // Adjustment form
  const [adjustedQty, setAdjustedQty] = useState<string>('0');
  const [adjustReason, setAdjustReason] = useState<string>('Inventory audit count');

  // Transactions list
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory(
        user?.vendorId ? { vendorId: user.vendorId } : undefined
      );
      if (res.success) {
        setIngredients(res.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [user?.vendorId]);

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addIngredient({
        name: name.trim(),
        quantity: parseFloat(quantity),
        unit,
        minThreshold: parseFloat(minThreshold),
        costPerUnit: parseFloat(costPerUnit),
      });

      if (res.success) {
        setAddModalOpen(false);
        setName('');
        loadInventory();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add ingredient');
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    try {
      const res = await api.restockIngredient(
        selectedIngredient.id,
        parseFloat(restockAmount),
        undefined,
        restockNote.trim() || undefined
      );

      if (res.success) {
        setRestockModalOpen(false);
        loadInventory();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restock');
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    try {
      const res = await api.adjustIngredient(
        selectedIngredient.id,
        parseFloat(adjustedQty),
        adjustReason.trim()
      );

      if (res.success) {
        setAdjustModalOpen(false);
        loadInventory();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this ingredient?')) return;
    try {
      const res = await api.deleteIngredient(id);
      if (res.success) {
        loadInventory();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete ingredient');
    }
  };

  const handleOpenHistory = async (ing?: Ingredient) => {
    try {
      setLoadingTx(true);
      setHistoryModalOpen(true);
      const res = await api.getInventoryTransactions(ing ? { ingredientId: ing.id } : undefined);
      if (res.success) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  const filteredIngredients = ingredients.filter((ing) => {
    if (filterLowStock && !ing.isLowStock && !ing.isOutOfStock) return false;
    if (!search.trim()) return true;
    return ing.name.toLowerCase().includes(search.toLowerCase());
  });

  const lowStockCount = ingredients.filter((i) => i.isLowStock || i.isOutOfStock).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Ingredient Inventory Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor raw ingredient levels, restock stock, record manual wastage, and trace audit consumption logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenHistory()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-slate-500" />
            Audit Logs
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Ingredient
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowStock(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              !filterLowStock ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Ingredients ({ingredients.length})
          </button>

          <button
            onClick={() => setFilterLowStock(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterLowStock
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Alerts ({lowStockCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ingredient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading inventory...</p>
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="font-bold text-slate-700 text-sm">No ingredients found</p>
            <p className="text-xs text-slate-400">Add raw ingredients (flour, rice, milk, vegetables) to track kitchen stock.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ingredient Name</th>
                  <th className="py-3 px-4">Stock Level & Progress</th>
                  <th className="py-3 px-3">Min Threshold</th>
                  <th className="py-3 px-3">Unit Cost</th>
                  <th className="py-3 px-3">Stock Status</th>
                  <th className="py-3 px-3">Linked In</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredIngredients.map((ing) => {
                  const percentage = Math.min(100, Math.round((ing.quantity / (ing.minThreshold * 3)) * 100));

                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ing.name}
                      </td>

                      {/* Stock Level Progress */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-1">
                          <span>
                            {ing.quantity.toFixed(1)} {ing.unit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              ing.isOutOfStock
                                ? 'bg-red-600'
                                : ing.isLowStock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, percentage)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">
                        {ing.minThreshold} {ing.unit}
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        ₹{ing.costPerUnit} / {ing.unit}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            ing.isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : ing.isLowStock
                              ? 'bg-amber-100 text-amber-700 animate-pulse'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {ing.isOutOfStock ? (
                            <>
                              <XCircle className="w-3 h-3" /> Out of Stock
                            </>
                          ) : ing.isLowStock ? (
                            <>
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" /> In Stock
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">
                        {ing.productsCount || 0} Dishes
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedIngredient(ing);
                              setRestockAmount('5');
                              setRestockNote('');
                              setRestockModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition flex items-center gap-1"
                            title="Add stock"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" /> Restock
                          </button>

                          <button
                            onClick={() => {
                              setSelectedIngredient(ing);
                              setAdjustedQty(ing.quantity.toString());
                              setAdjustReason('Physical inventory audit count');
                              setAdjustModalOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                            title="Adjust quantity manually"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(ing.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                            title="Delete ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Ingredient Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Add Raw Ingredient</h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIngredient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Cooking Butter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measurement *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="liter">liter (Liters)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="pcs">pcs (Pieces)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Low-Stock Alert Level *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Per Unit (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRestockModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Restock {selectedIngredient.name}</h3>
                <p className="text-[11px] text-slate-500">Current stock: {selectedIngredient.quantity} {selectedIngredient.unit}</p>
              </div>
              <button onClick={() => setRestockModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestock} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount to Add ({selectedIngredient.unit}) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-200 font-black text-lg outline-none focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Restock Notes / Vendor Batch (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly vendor delivery from mandi"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAdjustModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Adjust Stock: {selectedIngredient.name}</h3>
                <p className="text-[11px] text-slate-500">Current logged stock: {selectedIngredient.quantity} {selectedIngredient.unit}</p>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Actual Quantity ({selectedIngredient.unit}) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={adjustedQty}
                  onChange={(e) => setAdjustedQty(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-200 font-black text-lg outline-none focus:border-orange-500 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Adjustment / Wastage *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Spoiled in storage, spilled during prep, or inventory audit recount"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setHistoryModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Inventory Audit History</h3>
                <p className="text-xs text-slate-500">Real-time ledger of restocks, recipe order consumption, and adjustments</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingTx ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading audit trail...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No transaction logs recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <div key={t.id} className="py-3 flex items-start justify-between text-xs gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          t.type === 'RESTOCK' ? 'bg-emerald-100 text-emerald-800' :
                          t.type === 'ORDER_CONSUMPTION' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.type}
                        </span>
                        <h4 className="font-bold text-slate-900">{t.ingredient.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t.note}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-black ${t.quantity > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity} {t.ingredient.unit}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t.previousStock} → {t.newStock} {t.ingredient.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
