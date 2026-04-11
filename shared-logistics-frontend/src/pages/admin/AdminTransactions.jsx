import React, { useEffect, useState } from "react";
import API from "../../services/api";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await API.get("/admin/transactions");
        setTransactions(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTx();
  }, []);

  return (
    <div>
      <h2>Transactions</h2>

      <table>
        <thead>
          <tr>
            <th>Amount</th>
            <th>User</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((t) => (
            <tr key={t._id}>
              <td>KES {t.amount}</td>
              <td>{t.user?.name}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}