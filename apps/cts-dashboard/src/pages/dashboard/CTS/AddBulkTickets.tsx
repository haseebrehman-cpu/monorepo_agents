import GoBack from '../../../components/molecules/GoBack'

const AddBulkTickets = () => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row justify-between gap-2">
        <GoBack />
      </div>
      <h1 className="text-xl font-semibold text-slate-900">Add Bulk Tickets</h1>
    </div>
  )
}

export default AddBulkTickets