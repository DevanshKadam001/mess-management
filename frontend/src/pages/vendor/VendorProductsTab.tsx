import React, { useState, useEffect } from 'react';
import { Product, Category, Ingredient } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Flame,
  Search,
  Upload,
  Layers,
  Utensils,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export const VendorProductsTab: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isVeg, setIsVeg] = useState<boolean>(true);
  const [preparationTime, setPreparationTime] = useState<string>('15');
  const [calories, setCalories] = useState<string>('');
  const [badge, setBadge] = useState<string>('');
  const [recipe, setRecipe] = useState<{ ingredientId: string; quantityRequired: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingImg, setUploadingImg] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, ingRes] = await Promise.all([
        api.getProducts(user?.vendorId ? { vendorId: user.vendorId } : undefined),
        api.getCategories(),
        api.getInventory(),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) {
        setCategories(catRes.data);
        if (catRes.data.length > 0 && !categoryId) {
          setCategoryId(catRes.data[0].id);
        }
      }
      if (ingRes.success) setIngredients(ingRes.data);
    } catch (err) {
      console.error('Failed to load products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.vendorId]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId(categories[0]?.id || '');
    setImageUrl('https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&auto=format&fit=crop&q=80');
    setIsVeg(true);
    setPreparationTime('15');
    setCalories('350');
    setBadge('');
    setRecipe([]);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price.toString());
    setCategoryId(p.categoryId);
    setImageUrl(p.imageUrl);
    setIsVeg(p.isVeg);
    setPreparationTime(p.preparationTime.toString());
    setCalories(p.calories?.toString() || '');
    setBadge(p.badge || '');
    setRecipe(
      p.ingredients?.map((i) => ({
        ingredientId: i.ingredientId,
        quantityRequired: i.quantityRequired,
      })) || []
    );
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggleAvailability = async (productId: string) => {
    try {
      const res = await api.toggleProductAvailability(productId);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isAvailable: res.isAvailable } : p))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;
    try {
      const res = await api.deleteProduct(productId);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleAddRecipeIngredient = () => {
    if (ingredients.length === 0) {
      alert('Please add ingredients to your inventory first before linking recipes.');
      return;
    }
    setRecipe([...recipe, { ingredientId: ingredients[0].id, quantityRequired: 0.1 }]);
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleRecipeChange = (index: number, field: 'ingredientId' | 'quantityRequired', value: any) => {
    const updated = [...recipe];
    updated[index] = { ...updated[index], [field]: value };
    setRecipe(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        categoryId,
        imageUrl: imageUrl.trim(),
        isVeg,
        isAvailable: true,
        preparationTime: parseInt(preparationTime, 10) || 15,
        calories: calories ? parseInt(calories, 10) : null,
        badge: badge.trim() || null,
        ingredients: recipe.filter((r) => r.quantityRequired > 0),
      };

      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, payload);
        if (res.success) {
          setModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createProduct(payload);
        if (res.success) {
          setModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Food Menu & Recipes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add items, update prices, toggle availability, and configure ingredient recipe consumption
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading food items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
          <p className="font-bold text-slate-800 text-sm">No food products found</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl"
          >
            Add Your First Dish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
            >
              {/* Product Card Top */}
              <div>
                <div className="relative h-40 w-full bg-slate-100">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className={`w-full h-full object-cover ${!p.isAvailable ? 'grayscale opacity-60' : ''}`}
                  />
                  <div className="absolute top-3 left-3 bg-white p-1 rounded-md shadow-xs">
                    <span
                      className={`w-3 h-3 rounded-[2px] border-2 flex items-center justify-center ${
                        p.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                  </div>

                  {p.badge && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {p.badge}
                    </span>
                  )}

                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-white bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                    <span>⏱️ {p.preparationTime} mins</span>
                    {p.calories && <span>🔥 {p.calories} kcal</span>}
                    <span>Category: {p.category?.name || 'General'}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <span className="font-black text-slate-900 text-sm flex-shrink-0">
                      ₹{p.price.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

                  {/* Recipe Link Count */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      {p.ingredients?.length || 0} Ingredients in Recipe
                    </span>
                    <span
                      className={`font-bold ${
                        p.isAvailable ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {p.isAvailable ? '● Available' : '○ Unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                <button
                  onClick={() => handleToggleAvailability(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    p.isAvailable
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {p.isAvailable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {p.isAvailable ? 'Hide from Menu' : 'Make Available'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 text-slate-500 hover:text-orange-600 rounded-xl hover:bg-orange-50 transition"
                    title="Edit dish & recipe"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                    title="Delete dish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-100 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingProduct ? 'Edit Food Product' : 'Add New Food Product'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure dish details and automatic recipe ingredient deduction rule
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Food Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paneer Butter Masala"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe aroma, taste, serving details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Price in Indian Rupees (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="120"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Food Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image URL or Local Upload */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Food Image (URL or Local Upload) *
                    </label>
                    <label className="text-[11px] text-orange-600 hover:text-orange-700 font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingImg ? 'Uploading...' : 'Upload Image File'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setUploadingImg(true);
                              const res = await api.uploadImage(file);
                              if (res.success && res.url) {
                                setImageUrl(res.url);
                              }
                            } catch (err) {
                              alert('Failed to upload image file');
                            } finally {
                              setUploadingImg(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/... or uploaded path"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>

                {/* Diet Type */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Diet Classification
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVeg(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isVeg ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-300" /> Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVeg(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        !isVeg ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-300" /> Non-Veg
                    </button>
                  </div>
                </div>

                {/* Preparation Time */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preparation Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>

                {/* Calories */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Calories (kcal) - Optional
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 420"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>

                {/* Promotional Badge */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Badge - Optional
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller, Chef's Special"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Recipe Ingredients Linkage Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Ingredient Consumption Recipe Rule
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      When order is accepted/cooked, system automatically deducts these quantities from inventory
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecipeIngredient}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200 transition"
                  >
                    + Add Ingredient
                  </button>
                </div>

                {recipe.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center">
                    No ingredients linked. Click '+ Add Ingredient' to link inventory items to this product.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recipe.map((rItem, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <select
                          value={rItem.ingredientId}
                          onChange={(e) => handleRecipeChange(idx, 'ingredientId', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 outline-none"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0.001"
                            value={rItem.quantityRequired}
                            onChange={(e) =>
                              handleRecipeChange(idx, 'quantityRequired', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 outline-none text-right font-bold"
                          />
                          <span className="text-xs text-slate-500 font-medium w-8">
                            {ingredients.find((i) => i.id === rItem.ingredientId)?.unit || 'unit'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeIngredient(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Dish' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
