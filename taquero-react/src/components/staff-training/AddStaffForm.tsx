import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function AddStaffForm() {
  const navigate = useNavigate()
  const { addStaffMember, staffMembers } = useStaffTrainingStore()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [initials, setInitials] = useState('')
  const [position, setPosition] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim() || !position.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Name and position are required',
        variant: 'destructive',
      })
      return
    }

    if (!initials.trim() || initials.trim().length !== 2) {
      toast({
        title: 'Invalid Initials',
        description: 'Staff initials must be exactly 2 letters',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await addStaffMember({
        name: name.trim(),
        initials: initials.trim().toUpperCase(),
        position: position.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      toast({
        title: 'Staff Member Added',
        description: `${name} has been added to the team`,
      })

      // Find the newly added staff member and navigate to their detail page
      setTimeout(() => {
        const newStaff = staffMembers.find((s) => s.name === name.trim())
        if (newStaff) {
          navigate(`/module/staff-training/${newStaff.id}`)
        } else {
          navigate('/module/staff-training')
        }
      }, 100)
    } catch (error) {
      console.error('Error adding staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to add staff member. Please try again.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/module/staff-training')}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Add Staff Member</h1>
          <p className="text-sm text-muted-foreground">Create a new team member profile</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter staff member's full name"
                  className="h-12 text-base"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {/* Initials */}
              <div className="space-y-2">
                <label htmlFor="initials" className="text-sm font-medium">
                  Staff Initials <span className="text-destructive">*</span>
                </label>
                <Input
                  id="initials"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  placeholder="e.g., HV"
                  maxLength={2}
                  className="h-12 text-base font-mono uppercase"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Enter 2 letters (e.g., "HV" for Hugo Verdes)
                </p>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label htmlFor="position" className="text-sm font-medium">
                  Position <span className="text-destructive">*</span>
                </label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Kitchen Hand, Chef, Manager"
                  className="h-12 text-base"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email (optional)
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-12 text-base"
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone (optional)
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+64 21 XXX XXXX"
                  className="h-12 text-base"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 px-8 min-h-[56px] text-base font-medium flex-1"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {isSubmitting ? 'Adding...' : 'Add Staff Member'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/module/staff-training')}
                disabled={isSubmitting}
                className="h-14 px-6 min-h-[56px] text-base"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
