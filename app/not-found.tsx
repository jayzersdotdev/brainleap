import AppShell from '@/components/app-shell'

export default function NotFound() {
	return (
		<AppShell>
			<div className="flex flex-col h-[100svh] justify-center items-center">
				<h1 className="text-2xl font-extrabold">No Courses Found</h1>
			</div>
		</AppShell>
	)
}
