import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'entries'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function addEntry(data) {
    await addDoc(collection(db, 'entries'), {
      ...data,
      amount: parseFloat(data.amount),
      createdAt: serverTimestamp(),
    });
  }

  async function deleteEntry(id) {
    await deleteDoc(doc(db, 'entries', id));
  }

  async function updateEntryStatus(id, status) {
    await updateDoc(doc(db, 'entries', id), { status });
  }

  return { entries, loading, addEntry, deleteEntry, updateEntryStatus };
}
