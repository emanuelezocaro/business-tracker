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

  function applyCompletionConversion(data) {
    if (data.status === 'completato' && data.type === 'debito')  return { ...data, type: 'costo'  };
    if (data.status === 'completato' && data.type === 'credito') return { ...data, type: 'ricavo' };
    return data;
  }

  async function addEntry(data) {
    const resolved = applyCompletionConversion(data);
    await addDoc(collection(db, 'entries'), {
      ...resolved,
      amount: parseFloat(resolved.amount),
      createdAt: serverTimestamp(),
    });
  }

  async function deleteEntry(id) {
    await deleteDoc(doc(db, 'entries', id));
  }

  async function updateEntryStatus(id, status, entryType) {
    const updates = { status };
    if (status === 'completato' && entryType === 'credito') updates.type = 'ricavo';
    if (status === 'completato' && entryType === 'debito') updates.type = 'costo';
    await updateDoc(doc(db, 'entries', id), updates);
  }

  async function updateEntry(id, data) {
    const resolved = applyCompletionConversion(data);
    await updateDoc(doc(db, 'entries', id), {
      ...resolved,
      amount: parseFloat(resolved.amount),
    });
  }

  return { entries, loading, addEntry, deleteEntry, updateEntryStatus, updateEntry };
}
