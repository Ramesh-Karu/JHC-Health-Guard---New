import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QrCode } from 'lucide-react';
import QRScanner from '../components/QRScanner';

export default function BreakfastClubAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [analytics, setAnalytics] = useState<any>({ totalReservations: 0, totalRevenue: 0, popularItems: [] });
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, sellingDate: '', category: '', nutritionInfo: '' });
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const itemsSnapshot = await getDocs(collection(db, 'breakfast_items'));
      const itemsData = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData as any);

      const reservationsSnapshot = await getDocs(collection(db, 'breakfast_reservations'));
      const reservationsData = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(reservationsData as any);

      // Calculate analytics
      let totalRevenue = 0;
      const itemCounts: Record<string, number> = {};

      reservationsData.forEach((res: any) => {
        totalRevenue += res.totalPrice || 0;
        itemCounts[res.itemName] = (itemCounts[res.itemName] || 0) + res.quantity;
      });

      const popularItems = Object.entries(itemCounts)
        .map(([name, totalQuantity]) => ({ name, totalQuantity }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

      setAnalytics({
        totalReservations: reservationsData.length,
        totalRevenue,
        popularItems
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'breakfast_items/reservations');
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'breakfast_items'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      fetchData();
      setFormData({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, sellingDate: '', category: '', nutritionInfo: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'breakfast_items');
    }
  };

  const markCollected = async (id: string) => {
    try {
      await updateDoc(doc(db, 'breakfast_reservations', id), {
        status: 'Collected'
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `breakfast_reservations/${id}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Breakfast Club Admin Panel</h1>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <QrCode size={18} />
          Scan Passbook
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Reservations</p>
          <p className="text-3xl font-bold">{analytics.totalReservations}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Revenue</p>
          <p className="text-3xl font-bold">Rs {analytics.totalRevenue}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Popular Item</p>
          <p className="text-xl font-bold">{analytics.popularItems[0]?.name || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border">
        <h2 className="text-xl font-bold mb-6">Popular Breakfast Items</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.popularItems}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalQuantity" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Add New Breakfast Item</h2>
        <form onSubmit={addItem} className="grid grid-cols-2 gap-4">
          <input placeholder="Name" onChange={e => setFormData({...formData, name: e.target.value})} className="p-2 border rounded-xl" />
          <input placeholder="Image URL" onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="p-2 border rounded-xl" />
          <input placeholder="Price (Rs)" type="number" onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="p-2 border rounded-xl" />
          <input placeholder="Quantity" type="number" onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="p-2 border rounded-xl" />
          <input placeholder="Selling Date (YYYY-MM-DD)" onChange={e => setFormData({...formData, sellingDate: e.target.value})} className="p-2 border rounded-xl" />
          <input placeholder="Category" onChange={e => setFormData({...formData, category: e.target.value})} className="p-2 border rounded-xl" />
          <input placeholder="Nutrition Info" onChange={e => setFormData({...formData, nutritionInfo: e.target.value})} className="p-2 border rounded-xl col-span-2" />
          <button type="submit" className="bg-blue-500 text-white py-2 rounded-xl col-span-2">Add Item</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Reservations</h2>
        {reservations.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{r.itemName} - {r.userName}</h3>
              <p className="text-sm text-slate-500">{r.quantity} units</p>
            </div>
            {r.status === 'Reserved' && (
              <button onClick={() => markCollected(r.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl">Mark Collected</button>
            )}
          </div>
        ))}
      </div>
      {isScannerOpen && <QRScanner onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
}
