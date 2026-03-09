import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { QrCode } from 'lucide-react';
import QRScanner from '../components/QRScanner';

export default function OrganicClubAdmin() {
  const { user } = useAuth();
  const [vegetables, setVegetables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [analytics, setAnalytics] = useState<any>({ totalReservations: 0, totalRevenue: 0, popularVegetables: [] });
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, harvestDate: '', sellingDay: '', nutritionBenefits: '', isOrganic: 1 });
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const vegSnapshot = await getDocs(collection(db, 'vegetables'));
      const vegData = vegSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVegetables(vegData as any);

      const resSnapshot = await getDocs(collection(db, 'organic_reservations'));
      const resData = resSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(resData as any);

      // Calculate analytics
      let totalRevenue = 0;
      const vegCounts: Record<string, number> = {};

      resData.forEach((res: any) => {
        totalRevenue += res.totalPrice || 0;
        vegCounts[res.vegetableName] = (vegCounts[res.vegetableName] || 0) + res.quantity;
      });

      const popularVegetables = Object.entries(vegCounts)
        .map(([name, totalQuantity]) => ({ name, totalQuantity }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

      setAnalytics({
        totalReservations: resData.length,
        totalRevenue,
        popularVegetables
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'vegetables/organic_reservations');
    }
  };

  const addVegetable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'vegetables'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      fetchData();
      setFormData({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, harvestDate: '', sellingDay: '', nutritionBenefits: '', isOrganic: 1 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vegetables');
    }
  };

  const markCollected = async (id: string) => {
    try {
      await updateDoc(doc(db, 'organic_reservations', id), {
        status: 'Collected'
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `organic_reservations/${id}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organic Club Admin Panel</h1>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <QrCode size={18} />
          Scan Passbook
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Reservations</p>
          <p className="text-3xl font-bold">{analytics.totalReservations}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Revenue</p>
          <p className="text-3xl font-bold">Rs {analytics.totalRevenue}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Popular Vegetable</p>
          <p className="text-xl font-bold">{analytics.popularVegetables[0]?.name || 'N/A'}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Vegetable</h2>
        <form onSubmit={addVegetable} className="grid grid-cols-2 gap-4">
          <input placeholder="Name" onChange={e => setFormData({...formData, name: e.target.value})} className="p-2 border rounded-xl" />
          <input placeholder="Image URL" onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="p-2 border rounded-xl" />
          <input placeholder="Price (Rs)" type="number" onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="p-2 border rounded-xl" />
          <input placeholder="Quantity" type="number" onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="p-2 border rounded-xl" />
          <button type="submit" className="bg-blue-500 text-white py-2 rounded-xl col-span-2">Add Vegetable</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Reservations</h2>
        {reservations.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{r.vegetableName} - {r.userName}</h3>
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
