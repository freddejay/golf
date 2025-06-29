import React, { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import sv from 'date-fns/locale/sv';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker.css';
import notification from "./assets/notification.mp3"

registerLocale('sv', sv); // Register Swedish locale

const GolfTeeTimeApp = () => {
   const audio = new Audio(notification)
  const minTime = new Date();
  minTime.setHours(5, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(20, 0, 0);

  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    setMuted(!muted);
  };
  const [players, setPlayers] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [fromTime, setFromTime] = useState(minTime);
  const [toTime, setToTime] = useState(maxTime);
  const [response, setResponse] = useState(null);
  const pollingInterval = useRef(null);

  useEffect(() => {
    const updateTimeWithNewDate = (originalTime) => {
      const updated = new Date(selectedDate);
      updated.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
      return updated;
    };

    setFromTime((prev) => updateTimeWithNewDate(prev));
    setToTime((prev) => updateTimeWithNewDate(prev));
  }, [selectedDate]);

  const fetchTeeTimes = async () => {
    try {
      const courseId = '0f1334d7-88dc-444d-bd14-1a5a19ea5aa6'
      const url = new URL("https://prd-sgf-widget-api.azurewebsites.net/api/widget/club/71d046c5-1016-4b88-9347-eade7d50d2b7/courseSchedule");
    
      url.searchParams.append('courseId', courseId);
      url.searchParams.append('date', selectedDate.toLocaleDateString('sv-SE'));

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setResponse({ error: 'Failed to fetch data.' });
    }
  };

  const clearExistingInterval = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const startPolling = () => {
    pollingInterval.current = setInterval(() => {
      fetchTeeTimes();
    }, 5 * 60 * 1000); // 5 minutes
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearExistingInterval();  // clear old interval
    fetchTeeTimes();              // fetch immediately
    startPolling();           // start new polling
  };

  useEffect(() => {
    const matches = response?.slots?.filter((slot) => slot?.availablity.availableSlots >= players && new Date(slot.time) >= fromTime && new Date(slot.time) <= toTime)
    if(!muted && matches?.length > 0) {
      audio.play()
    }
  }, [response])

  useEffect(() => {
    return () => clearInterval(pollingInterval.current);
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🏌️ Golf Tee Time Booking 
        <span style={styles.icon} onClick={toggleMute} role="button" aria-label="Toggle sound">
          {muted ? "🔇" : "🔊"}
        </span>
      </h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label>Number of Players (1–4):</label>
            <input
              type="number"
              min="1"
              max="4"
              value={players}
              onChange={(e) => setPlayers(e.target.value)}
              required
              className="input"
            />
          </div>

          <div style={styles.field}>
            <label>Date:</label>
            <DatePicker
              locale="sv"
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="input"
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label>From Time:</label>
            <DatePicker
              locale="sv"
              selected={fromTime}
              onChange={(date) => setFromTime(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={10}
              timeCaption="Start"
              dateFormat="HH:mm"
              className="input"
            />
          </div>

          <div style={styles.field}>
            <label>To Time:</label>
            <DatePicker
              locale="sv"
              selected={toTime}
              onChange={(date) => setToTime(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={10}
              timeCaption="End"
              dateFormat="HH:mm"
              className="input"
            />
          </div>
        </div>

        <button type="submit">Check Availability</button>
      </form>

      {response && (
        <div style={styles.response}>
          <table>
            <tbody>
              {response?.slots?.filter((slot) => slot?.availablity.availableSlots >= players && new Date(slot.time) >= fromTime && new Date(slot.time) <= toTime).map((slot) => {
                const date = new Date(slot.time)
                return (
                    <tr>
                      <td>{date.toLocaleTimeString('sv-SE')}</td>
                      <td>{slot.availablity?.availableSlots}</td>
                    </tr>
                    )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '2rem',
    maxWidth: '500px',
    margin: 'auto',
    backgroundColor: '#f3f9f1',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    // boxSizing now global, no need here
  },
  header: {
    display: "flex",
    justifyContent: 'space-between',
    alignItems: "center",
    gap: "10px",
    fontFamily: "Arial, sans-serif",
  },
  icon: {
    cursor: "pointer",
    fontSize: "24px",
    userSelect: "none",
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    // Removed gap here
  },
  row: {
    display: 'flex',
    // Removed gap here
    marginLeft: '-0.5rem',  // Negative margin to offset field padding
    marginRight: '-0.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,      // <-- Important: allows shrinking inside flex container
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    paddingBottom: '1rem',
  },
  response: {
    marginTop: '2rem',
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
  }
};


export default GolfTeeTimeApp;
