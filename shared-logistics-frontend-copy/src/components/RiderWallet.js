import React, { useState, useEffect, useMemo } from "react";
import API from "../services/api";
import "../styles/RiderWallet.css";
import { useToast } from "../context/ToastContext";
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
export default function RiderWallet() {
  const [form, setForm] = useState({
    phone: "",
    amount: "",
    password: ""
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { showToast } = useToast();

  const pageSize = 20;

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const res = await API.get("/api/rider/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!form.phone || !form.amount || !form.password) {
      return showToast("error", "All fields are required");
    }

    if (Number(form.amount) <= 0) {
      return showToast("error", "Invalid amount");
    }

    try {
      setLoading(true);

      await API.post("/api/rider/withdraw", form);

      showToast("success", "Withdrawal request sent successfully");
      setForm({ phone: "", amount: "", password: "" });

      fetchTransactions();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ===== FILTERING LOGIC =====
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // status filter
        if (statusFilter !== "all" && tx.status !== statusFilter) {
          return false;
        }

        // date filter (compare only YYYY-MM-DD)
        if (dateFilter) {
          const txDate = new Date(tx.createdAt)
            .toISOString()
            .split("T")[0];

          if (txDate !== dateFilter) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transactions, statusFilter, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter]);

  return (
    <div className="wallet-container">

      {/* ===== Withdraw Section ===== */}
      <div className="wallet-card">
        <h2>Withdraw Earnings</h2>

        <form onSubmit={handleWithdraw}>
          <input
            type="text"
            name="phone"
            placeholder="MPESA Phone Number"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
          />


          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Account Password"
              value={form.password}
              onChange={handleChange}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#000000",
                fontSize: "20px",

              }}
            >
              {showPassword ?  (<FaEyeSlash /> ) : ( <FaEye />)}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Withdraw"}
          </button>
        </form>
      </div>

      {/* ===== Transactions Section ===== */}
      <div className="wallet-card">
        <h2>Transaction History</h2>

        {/* Filters */}
        <div className="filters" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <button
            onClick={() => {
              setStatusFilter("all");
              setDateFilter("");
            }}
          >
            Clear
          </button>
        </div>

        {/* Transactions */}
        {paginatedTransactions.length === 0 ? (
          <p className="empty">No transactions found</p>
        ) : (
          <div className="transactions">
            {paginatedTransactions.map((tx) => (
              <div key={tx._id} className="transaction">
                <div>
                  <p className="amount">KSh {tx.amount}</p>
                  <p className="date">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>

                <span className={`status ${tx.status}`}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="pagination" style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>

          <span>
            Page {currentPage} / {totalPages || 1}
          </span>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}