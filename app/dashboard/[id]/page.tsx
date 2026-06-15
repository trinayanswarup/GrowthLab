interface Props {
  params: { id: string }
}

export default function DashboardPage({ params }: Props) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Audit Dashboard</h1>
      <p className="text-[#6b7280] text-sm font-mono">ID: {params.id}</p>
    </div>
  )
}
