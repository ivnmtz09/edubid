import GroupList from "../groups/GroupList"

const ClassroomDetail = ({ classroomId }) => {
  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/5">
      {/* Info de la clase */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{/* Nombre clase */}</h1>
      </section>

      {/* Listado de grupos */}
      <GroupList classroomId={classroomId} />
    </div>
  )
}

export default ClassroomDetail
