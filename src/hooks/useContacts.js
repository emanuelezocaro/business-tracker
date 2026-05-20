import { useState, useEffect } from 'react';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contacts'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function addContact(data) {
    await addDoc(collection(db, 'contacts'), { ...data, createdAt: serverTimestamp() });
  }

  async function deleteContact(id) {
    await deleteDoc(doc(db, 'contacts', id));
  }

  return { contacts, loading, addContact, deleteContact };
}
