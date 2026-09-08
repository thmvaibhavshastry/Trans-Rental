import { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicleService';

export function useCategories() {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehicleService.getCategories()
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load categories', err);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}
