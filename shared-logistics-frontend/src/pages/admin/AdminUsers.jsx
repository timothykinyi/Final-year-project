import React, { useEffect, useState } from "react";
import API from "../../services/api";
import "../../styles/AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  // NEW
  const [activeTab, setActiveTab] = useState("shops");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id) => {
    try {
      setLoadingId(id);

      await API.patch(`/admin/users/${id}/status`);

      setUsers((prev) =>
        prev.map((user) => {
          if (user._id !== id) return user;

          if (user.role === "shop") {
            return { ...user, active: !user.active };
          }

          if (user.role === "rider") {
            return {
              ...user,
              status:
                user.status === "active" ? "suspended" : "active",
            };
          }

          return user;
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔥 Filter by tab
  const filteredUsers = users.filter((u) =>
    activeTab === "shops" ? u.role === "shop" : u.role === "rider"
  );

  // 🔥 Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const goPrev = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // 🔥 Reset page when switching tab
  const switchTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getStatus = (user) => {
    if (user.role === "shop") {
      return user.active ? "Active" : "Blocked";
    }

    if (user.role === "rider") {
      return user.status === "active" ? "Active" : "Suspended";
    }

    return "Unknown";
  };

  return (
    <div className="admin-users">
      <h2>Users Management</h2>

      {/* 🔥 Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "shops" ? "active" : ""}
          onClick={() => switchTab("shops")}
        >
          Shops
        </button>

        <button
          className={activeTab === "riders" ? "active" : ""}
          onClick={() => switchTab("riders")}
        >
          Riders
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No users found
                </td>
              </tr>
            ) : (
              currentUsers.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>

                  <td>
                    <span className={`role ${u.role}`}>
                      {u.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status ${getStatus(u).toLowerCase()}`}
                    >
                      {getStatus(u)}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => toggleStatus(u._id)}
                      disabled={loadingId === u._id}
                    >
                      {loadingId === u._id
                        ? "Updating..."
                        : "Toggle Status"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 🔥 Pagination */}
        <div className="pagination">
          <button onClick={goPrev} disabled={currentPage === 1}>
            Prev
          </button>

          <span>
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            onClick={goNext}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}