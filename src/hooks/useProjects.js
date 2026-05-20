import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function addProject(data) {
    await addDoc(collection(db, 'projects'), {
      ...data,
      value: parseFloat(data.value) || 0,
      createdAt: serverTimestamp(),
    });
  }

  async function updateProject(id, data) {
    const updates = { ...data };
    if (data.value !== undefined) updates.value = parseFloat(data.value) || 0;
    await updateDoc(doc(db, 'projects', id), updates);
  }

  async function deleteProject(id) {
    await deleteDoc(doc(db, 'projects', id));
  }

  return { projects, loading, addProject, updateProject, deleteProject };
}
