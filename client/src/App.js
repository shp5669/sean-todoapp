import ListHeader from "./components/ListHeader";
import ListItem from "./components/ListItem";
import Auth from "./components/Auth";
import { useEffect, useState, useCallback } from "react";
import { useCookies } from "react-cookie";

const App = () => {
  const [cookies] = useCookies(null);
  const authToken = cookies.AuthToken;
  const userEmail = cookies.Email;
  const [tasks, setTasks] = useState([]); // ✅ Always an array

  const getData = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVERURL}/todos/${userEmail}`
      );
      const json = await response.json();

      if (Array.isArray(json)) {
        setTasks(json);
      } else {
        console.error("API response is not an array:", json);
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    }
  }, [userEmail]);

  useEffect(() => {
    if (authToken) {
      getData();
    }
  }, [authToken, getData]);

  console.log("Tasks:", tasks);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.date || !b.date) return 0; // Prevent NaN errors
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="app">
      {!authToken && <Auth />}
      {authToken && (
        <>
          <ListHeader listName={"🏝️ Holiday tick list"} getData={getData} />
          <p className="user-email">Welcome back {userEmail}</p>
          {sortedTasks.map((task) => (
            <ListItem key={task.id} task={task} getData={getData} />
          ))}
        </>
      )}
      <p className="copyright">© Creative Coding LLC</p>
    </div>
  );
};

export default App;
