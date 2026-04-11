import React, { useEffect, useState } from "react";
import API from "../../services/api";
import "../../styles/AdminDeliveries.css";

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await API.get("/admin/deliveries");
        setDeliveries(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDeliveries();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = deliveries.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(deliveries.length / itemsPerPage);

  const goNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="deliveries-container">
      <div className="deliveries-header">
        <h2>Deliveries</h2>
        <p>Monitor all platform deliveries in real time</p>
      </div>

      <div className="table-wrapper">
        <table className="deliveries-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Paid</th>
              <th>Shop</th>
              <th>Rider</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {currentDeliveries.map((d) => (
              <tr key={d._id}>
                <td className="id-cell">{d._id}</td>

                <td>
                  <span className={`badge ${d.paymentStatus}`}>
                    {d.paymentStatus}
                  </span>
                </td>

                <td>{d.shop?.name}</td>

                <td>{d.rider?.name || "Unassigned"}</td>

                <td>
                  <span className={`status ${d.status}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="pagination">
          <button onClick={goPrev} disabled={currentPage === 1}>
            Prev
          </button>

          <span>
            Page {currentPage} of {totalPages || 1}
          </span>

          <button onClick={goNext} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}