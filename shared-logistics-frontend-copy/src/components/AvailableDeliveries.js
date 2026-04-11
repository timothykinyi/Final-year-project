import React, { useEffect, useState } from "react";
import "../styles/AvailableDeliveries.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API from "../services/api";

function AvailableDeliveryGroups() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await API.get(`/api/riders/available-deliveries`);

        if (res.data && Array.isArray(res.data.available)) {
          setGroups(res.data.available);
        } else {
          setGroups([]);
        }
      } catch (err) {
        console.error("Error fetching delivery groups", err);
        setGroups([]);
      }
    };

    fetchGroups();
  }, []);

  const acceptGroup = async (groupId) => {
    try {
      const res = await API.put(`/api/riders/accept-delivery/${groupId}`, {})

      toast.success(res.data.message, {
        position: "top-right",
        autoClose: 5000,
        theme: "colored"
      });

      setGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept delivery", {
        position: "top-right",
        autoClose: 5000,
        theme: "colored"
      });
    }
  };

  return (
    <div className="available-deliveries-wrapper">
      <div className="available-deliveries">
        <ToastContainer />
        <h2>Available Delivery Groups</h2>

        {groups.length === 0 ? (
          <p className="empty">No delivery groups available.</p>
        ) : (
          <div className="deliveries-grid">
            {groups.map((g) => (
              <div key={g._id} className="delivery-card">
                <div className="group-summary">
                  <p><strong>Weight:</strong> {g.totalWeight} kg</p>
                  <p><strong>Cost:</strong> KES {g.totalCost}</p>
                </div>

                <div className="group-deliveries">
                  {g.deliveries.map((d) => (
                    <div key={d._id} className="delivery-item">
                      <p><strong>{d.customerName}</strong></p>
                      <p>{d.customerPhone}</p>
                      <p className="address">{d.customerAddress}</p>
                    </div>
                  ))}
                </div>

                <button onClick={() => acceptGroup(g._id)}>Accept</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AvailableDeliveryGroups;