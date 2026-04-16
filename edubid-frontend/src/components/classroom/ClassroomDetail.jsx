import GroupList from "../groups/GroupList"

const ClassroomDetail = ({ classroomId }) => {
  return (
    <div className="space-y-6">
      {/* Info de la clase */}
      <section>
        <h1 className="text-2xl font-bold">{/* Nombre clase */}</h1>
      </section>

      {/* Listado de grupos */}
      <GroupList classroomId={classroomId} />
    </div>
  )
}
