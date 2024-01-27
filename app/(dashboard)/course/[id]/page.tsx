import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getAssignments } from '@/lib/queries/assignment'
import { getCourseById } from '@/lib/queries/course'
import { notFound, redirect } from 'next/navigation'
import { unstable_noStore } from 'next/cache'
import { Tabs, TabPanel, TabList, Tab } from '@/ui/tabs'
import { Suspense } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Assignments } from './assignments'
import { Announcements } from './announcements'
import { People } from './people'
import { Grades } from './grades'

export const dynamic = 'force-dynamic'

type Props = {
	params: {
		id: string
	}
}

export async function generateStaticParams() {
	const supabase = createBrowserClient()
	const { data: courseIds, error } = await supabase
		.from('courses')
		.select('course_id')

	if (error) throw new Error(`${error.message}`)

	return courseIds.map((courseId) => ({
		params: {
			id: courseId,
		},
	}))
}

export default async function Page({ params }: Props) {
	unstable_noStore()
	const cookieStore = cookies()
	const supabase = createClient(cookieStore)

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/signin')
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.limit(1)
		.eq('profile_id', user.id)
		.single()

	if (!profile) {
		redirect('/auth/signin')
	}

	const course = await getCourseById(params.id)

	if (!course) {
		notFound()
	}

	const { data: announcements } = await supabase
		.from('announcements')
		.select('*')
		.eq('course_id', course.course_id)

	if (!announcements) {
		notFound()
	}

	const assignments = await getAssignments(course.course_id)

	if (!assignments) {
		notFound()
	}

	const { data: enrolledPeople, error } = await supabase
		.from('enrollments')
		.select('*')
		.eq('course_id', course.course_id)

	if (error) {
		throw new Error(error.message)
	}

	return (
		<main className="px-8 py-6 w-full flex flex-col">
			<section>
				<h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
					{course.course_name}
				</h1>
				<p className="leading-7 [&:not(:first-child)]:mt-6 text-gray-500">
					{course.course_description}
				</p>
			</section>
			<Tabs defaultSelectedKey="announcements" className="py-8">
				<TabList>
					<Tab id="announcements">Announcements</Tab>
					<Tab id="assignments">Assignments</Tab>
					<Tab id="people">People</Tab>
					{profile.role === 'instructor' && (
						<Tab id="grades">Grades</Tab>
					)}
				</TabList>
				<TabPanel id="announcements">
					<Suspense fallback={<p>Loading...</p>}>
						<Announcements
							course={course}
							profile={profile}
							announcements={announcements}
						/>
					</Suspense>
				</TabPanel>
				<TabPanel id="assignments">
					<Suspense fallback={<p>Loading...</p>}>
						<Assignments
							course={course}
							assignments={assignments}
							profile={profile}
						/>
					</Suspense>
				</TabPanel>
				<TabPanel id="people">
					<Suspense fallback={<p>Loading...</p>}>
						<People enrolledPeople={enrolledPeople} />
					</Suspense>
				</TabPanel>
				{profile.role === 'instructor' && (
					<TabPanel id="grades">
						<Suspense fallback={<p>Loading...</p>}>
							<Grades assignments={assignments} />
						</Suspense>
					</TabPanel>
				)}
			</Tabs>
		</main>
	)
}
