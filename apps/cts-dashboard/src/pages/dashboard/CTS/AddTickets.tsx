import AddNewTicket from '../../../components/atoms/AddTicket/AddNewTicket'
import GoBack from '../../../components/molecules/GoBack'

const AddTickets = () => {
    return (
        <div className="flex flex-col gap-3">
            <div className="mb-2">
                <div className="flex items-center gap-3">
                    <GoBack />
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                            Add New Ticket
                        </h1>
                        <p className="text-xs text-slate-500">
                            Create a new support ticket and assign it to the relevant team.
                        </p>
                    </div>
                </div>
            </div>
            <AddNewTicket />
        </div>
    );
};

export default AddTickets;