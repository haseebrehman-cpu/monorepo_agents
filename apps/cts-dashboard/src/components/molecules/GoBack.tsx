import { Button } from '@rdx/ui'
import { ArrowLeftIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const GoBack = () => {
  const navigate = useNavigate();
  return (
    <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeftIcon className="h-4 w-4" />
        Back
    </Button>
  )
}

export default GoBack