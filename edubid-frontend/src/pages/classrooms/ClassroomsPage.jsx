import ClassroomList from "../../components/classroom/ClassroomList";

// El Layout (Layout.jsx) ya provee: bg-gray-50 dark:bg-gray-950, py-6, px-4 sm:px-6 lg:px-8
// Este contenedor es transparente para no crear un "canvas dentro de canvas"
const ClassroomsPage = () => {
  return (
    <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <ClassroomList />
    </div>
  );
};

export default ClassroomsPage;
