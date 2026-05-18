--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'TEACHER',
    'HOD',
    'PRINCIPAL'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: SubjectType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubjectType" AS ENUM (
    'THEORY',
    'PRACTICAL'
);


ALTER TYPE public."SubjectType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActivityEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ActivityEntry" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "teacherId" text NOT NULL,
    month text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ActivityEntry" OWNER TO postgres;

--
-- Name: AttendanceMonthly; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AttendanceMonthly" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "subjectOfferingId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    percentage double precision NOT NULL
);


ALTER TABLE public."AttendanceMonthly" OWNER TO postgres;

--
-- Name: AttendanceRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AttendanceRecord" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "studentId" text NOT NULL,
    status boolean NOT NULL
);


ALTER TABLE public."AttendanceRecord" OWNER TO postgres;

--
-- Name: AttendanceRisk; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AttendanceRisk" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "riskLevel" text NOT NULL,
    "riskProbability" double precision NOT NULL,
    attendance double precision NOT NULL,
    "notifiedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AttendanceRisk" OWNER TO postgres;

--
-- Name: AttendanceSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AttendanceSession" (
    id text NOT NULL,
    "subjectOfferingId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AttendanceSession" OWNER TO postgres;

--
-- Name: ClassTeacher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ClassTeacher" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "departmentId" text NOT NULL,
    "academicYear" text NOT NULL,
    year integer NOT NULL,
    semester integer NOT NULL,
    section text NOT NULL
);


ALTER TABLE public."ClassTeacher" OWNER TO postgres;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    name text NOT NULL,
    "hodId" text,
    "shortId" text NOT NULL
);


ALTER TABLE public."Department" OWNER TO postgres;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "subjectOfferingId" text,
    "subjectId" text,
    "fileType" text,
    size integer,
    category text DEFAULT 'personal'::text NOT NULL
);


ALTER TABLE public."Document" OWNER TO postgres;

--
-- Name: Enrollment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Enrollment" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    year integer NOT NULL,
    semester integer NOT NULL,
    "academicYear" text NOT NULL,
    section text DEFAULT 'A'::text NOT NULL
);


ALTER TABLE public."Enrollment" OWNER TO postgres;

--
-- Name: FeedbackFormLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FeedbackFormLog" (
    id text NOT NULL,
    "departmentId" text NOT NULL,
    "formLink" text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sentBy" text NOT NULL,
    "recipientCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."FeedbackFormLog" OWNER TO postgres;

--
-- Name: Institute; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Institute" (
    id text NOT NULL,
    "principalId" text NOT NULL
);


ALTER TABLE public."Institute" OWNER TO postgres;

--
-- Name: Mark; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Mark" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "subjectOfferingId" text NOT NULL,
    "examType" text NOT NULL,
    marks integer NOT NULL
);


ALTER TABLE public."Mark" OWNER TO postgres;

--
-- Name: Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Profile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    bio text,
    address text,
    designation text,
    experience text,
    "joiningDate" text,
    "profilePhoto" text,
    qualifications text
);


ALTER TABLE public."Profile" OWNER TO postgres;

--
-- Name: Report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    content text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL
);


ALTER TABLE public."Report" OWNER TO postgres;

--
-- Name: Student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Student" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "fullName" text NOT NULL,
    "departmentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email text
);


ALTER TABLE public."Student" OWNER TO postgres;

--
-- Name: Subject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subject" (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    "departmentId" text NOT NULL,
    type public."SubjectType" DEFAULT 'THEORY'::public."SubjectType" NOT NULL,
    semester integer DEFAULT 1 NOT NULL,
    year integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Subject" OWNER TO postgres;

--
-- Name: SubjectEnrollment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SubjectEnrollment" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "subjectOfferingId" text NOT NULL
);


ALTER TABLE public."SubjectEnrollment" OWNER TO postgres;

--
-- Name: SubjectOffering; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SubjectOffering" (
    id text NOT NULL,
    "subjectId" text NOT NULL,
    "teacherId" text NOT NULL,
    year integer NOT NULL,
    semester integer NOT NULL,
    section text NOT NULL,
    "academicYear" text
);


ALTER TABLE public."SubjectOffering" OWNER TO postgres;

--
-- Name: TeacherAttendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TeacherAttendance" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    month integer,
    year integer NOT NULL,
    type text DEFAULT 'DAILY'::text NOT NULL,
    status boolean DEFAULT true NOT NULL,
    percentage double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TeacherAttendance" OWNER TO postgres;

--
-- Name: TeacherFeedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TeacherFeedback" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    rating double precision NOT NULL,
    semester text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TeacherFeedback" OWNER TO postgres;

--
-- Name: TeacherPerformanceData; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TeacherPerformanceData" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "academicYear" text NOT NULL,
    "trainingsCompleted" integer DEFAULT 0 NOT NULL,
    "trainingDetails" text,
    "totalStudents" integer DEFAULT 0 NOT NULL,
    "passedStudents" integer DEFAULT 0 NOT NULL,
    "committeesParticipated" integer DEFAULT 0 NOT NULL,
    "eventsOrganized" integer DEFAULT 0 NOT NULL,
    "studentsMentored" integer DEFAULT 0 NOT NULL,
    "adminResponsibilityNotes" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TeacherPerformanceData" OWNER TO postgres;

--
-- Name: TimetableEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TimetableEntry" (
    id text NOT NULL,
    "departmentId" text NOT NULL,
    "dayOfWeek" text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "periodNumber" integer NOT NULL,
    subject text,
    room text,
    "teacherName" text,
    "teacherId" text,
    "academicYear" text NOT NULL,
    year integer,
    semester integer,
    section text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TimetableEntry" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "departmentId" text,
    "isBlocked" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: ActivityEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ActivityEntry" (id, "studentId", "teacherId", month, points, description, "createdAt", "updatedAt") FROM stdin;
a110b4b8-f978-4a67-8a58-6313608cfe89	fd519d52-433b-4bf7-8e7d-e18caeccf843	d52301d5-d9a4-4d66-ba12-dead4e77134c	jul	5	\N	2026-03-09 20:37:07.029	2026-03-09 20:37:07.029
1fd9415f-1b2c-4786-9b06-83f8aa214bb4	fd519d52-433b-4bf7-8e7d-e18caeccf843	d52301d5-d9a4-4d66-ba12-dead4e77134c	jul	6	\N	2026-03-09 20:37:08.649	2026-03-09 20:37:08.649
5b41989e-0a5a-41c3-84d1-c460a6e739a4	fd519d52-433b-4bf7-8e7d-e18caeccf843	d52301d5-d9a4-4d66-ba12-dead4e77134c	aug	5	\N	2026-03-09 20:37:12.69	2026-03-09 20:37:12.69
94b15f65-a85b-4fca-bb08-5ad17e4ec679	fd519d52-433b-4bf7-8e7d-e18caeccf843	d52301d5-d9a4-4d66-ba12-dead4e77134c	sep	3	\N	2026-03-09 20:37:15.267	2026-03-09 20:37:15.267
9b633f8e-d94c-4c25-b4bc-ec2b8a8c3d31	fd519d52-433b-4bf7-8e7d-e18caeccf843	d52301d5-d9a4-4d66-ba12-dead4e77134c	sep	3	\N	2026-03-09 20:37:17.443	2026-03-09 20:37:17.443
519ba46f-42e3-4870-8758-b0f1c28aa2b4	fd519d52-433b-4bf7-8e7d-e18caeccf843	d52301d5-d9a4-4d66-ba12-dead4e77134c	oct	5	\N	2026-03-09 20:37:48.802	2026-03-09 20:37:48.802
\.


--
-- Data for Name: AttendanceMonthly; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AttendanceMonthly" (id, "studentId", "subjectOfferingId", month, year, percentage) FROM stdin;
a39658e0-d148-477b-a817-3484639f0fa7	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	65
2d63a2a2-11a8-41bf-b797-5fca47d1d986	ab8d6a3a-8889-442c-996e-15825a25e37f	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	65
d5ea11dd-f9a9-431d-a8db-08d05cb83540	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	70
0d2edaa4-2819-48fc-ad54-7daa3ce895b5	ae753320-c362-4d8b-8294-53533a1a5798	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	65
ab9998c0-5a20-48cd-86c6-e37332674510	f1719575-4aea-4b3e-a61c-b8307ccf9516	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	52
96fc4d27-1c3f-4c99-8a55-54bb5cc5be17	128691dd-ff65-43d8-8bf4-bb59e2e58617	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	43
7416ba21-e82e-4a5c-a230-227d6fce50f7	65ef7119-ea28-4a7a-9329-fcef962e4343	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	61
d6fd8470-c28b-4695-9eb3-441743b7d871	c1c97976-38c1-4174-b028-57b0273c7fac	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	52
212b3f94-6d7b-40df-9536-296d0d623001	fd519d52-433b-4bf7-8e7d-e18caeccf843	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	39
376ec824-26a7-4328-b307-82c750e9d0f5	f3575bed-7b01-4358-bdf2-3d1f81cc2515	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	61
6776e93d-8133-4ef8-8a32-68e0c9309954	95465124-34e6-4104-95f7-2f6289016331	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	78
c8c71207-f9c7-454f-9a44-a7fb8b4f23a9	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	57
7d35038e-1f1d-4b17-82ba-8ddbe79d1a72	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	70
38a564f7-56c2-4dca-88a3-67d46530f15d	a78272dc-151f-400f-a0b4-1eeec317739c	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	70
0eb6be2c-2ac6-41d0-ba0a-3b6a7cbb7efb	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	65
40105d8e-d8b9-49f2-8896-e11bb6bcde58	47d8c413-5440-4d05-90cb-0757217fdfaf	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	70
0acbd9fa-f7c8-4aa2-a13f-9053b9e1edc1	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	65
9806a710-2dff-472e-a131-be4fadb7fc24	d1dce1c9-e82b-4efb-8d22-00117a37b94a	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	96
a7b14988-3f09-432e-b83b-6c4a41374f5b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	96
3996b4c4-ab0e-48dd-8ff5-045fe545c1e5	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	100
92117cd3-801b-4594-a0b2-1f2f669cbbb3	e79979e1-326f-4b84-b613-ce32953d1f05	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	100
cddcdbcc-a16c-4b09-a2ba-dc0ffc69314d	11c8fe77-61a2-4761-b804-46106525f467	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	96
704b3cd1-a95b-4f0f-927b-ce4087d28e0f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	100
74e9d09c-898d-4a9e-8050-8ee1b0f37f40	504a4c9a-95b7-4872-9db9-78483e3e1e60	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	91
e393340b-1f81-40e0-b401-d47c196ce4fe	c827a01f-387c-4c59-bfcd-829297a30a74	7e589f4c-041c-4721-8823-937f9a38f058	7	2026	70
9c1e8438-450d-4ed3-bf05-be5f12e58d35	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	79
34dc89d7-3a03-40c4-a675-c2f9b70fb1f0	ab8d6a3a-8889-442c-996e-15825a25e37f	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
e30defaa-1686-4ceb-afe8-754028afd8f0	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	83
de6db2c1-005f-469d-a462-35d4dc55b00e	ae753320-c362-4d8b-8294-53533a1a5798	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
a49f1753-35c7-4963-b279-f14f4b982ec3	f1719575-4aea-4b3e-a61c-b8307ccf9516	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	92
54b1b49d-7ae7-4c02-8a11-8484069cac95	128691dd-ff65-43d8-8bf4-bb59e2e58617	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	83
8a7809b2-6f26-472a-a690-6e46195027ef	65ef7119-ea28-4a7a-9329-fcef962e4343	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	79
5e3de401-ae20-4dbb-9290-aa4d108a8d62	c1c97976-38c1-4174-b028-57b0273c7fac	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
db3e42fb-dd1a-475f-ae85-df3f483bfc9e	fd519d52-433b-4bf7-8e7d-e18caeccf843	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
2815e4b3-7dff-450e-9a9b-37b70553ec63	f3575bed-7b01-4358-bdf2-3d1f81cc2515	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	83
2437fcf4-ad74-4997-ac70-263b6b56e3dd	95465124-34e6-4104-95f7-2f6289016331	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	83
9bf96b11-bace-4be4-b8b7-830b4e6f1a8b	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
9a3ecea1-1a6c-4660-a36c-6576045c95f0	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
c4d11894-2d94-4a2b-97aa-87b28a6e0fc6	a78272dc-151f-400f-a0b4-1eeec317739c	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	100
d7086bf4-8b17-4668-a064-cbad72336d77	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	71
0439e00d-8272-48c4-b3e1-522de706212d	47d8c413-5440-4d05-90cb-0757217fdfaf	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	83
9eed093b-0082-4ee1-88d6-34945e32b3f5	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	92
5c40dcb7-b332-428b-9125-9f98e2c04005	d1dce1c9-e82b-4efb-8d22-00117a37b94a	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
c8e66959-d623-41ea-b40c-4bc6a00776fd	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	92
b5a61f71-cf33-4a50-b36d-7d3ec0b92ef2	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	88
94914557-1ace-4a4d-9076-39a67b9dd528	e79979e1-326f-4b84-b613-ce32953d1f05	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	92
8e1603cb-8b7f-41b4-9996-e655128da148	11c8fe77-61a2-4761-b804-46106525f467	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	92
28e61f30-9719-4066-8d5c-1da8fc7a9082	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	96
1a30a3c3-2461-4417-9e4e-aff42db1d8a5	504a4c9a-95b7-4872-9db9-78483e3e1e60	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	75
6ed6507c-b3bc-4508-8cde-911cedc7aacc	c827a01f-387c-4c59-bfcd-829297a30a74	7e589f4c-041c-4721-8823-937f9a38f058	8	2026	100
c8e0c26e-600f-492f-a10f-fdf84661948b	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	65
bad18e77-3a7d-41dc-87bd-d14567a1a4f5	ab8d6a3a-8889-442c-996e-15825a25e37f	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	65
fa53535d-ec45-40e9-96a3-1f70943d7ca9	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	70
da211d65-0d6b-40f2-97b5-64ee927fcd23	ae753320-c362-4d8b-8294-53533a1a5798	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	65
91eef0fb-4d78-40af-94f6-5d8fb79ddf5a	f1719575-4aea-4b3e-a61c-b8307ccf9516	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	52
a6d6a2c7-bec5-4464-90cd-93b96131460e	128691dd-ff65-43d8-8bf4-bb59e2e58617	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	43
2e0c053c-a46c-4b91-9722-ef0991a52c8e	65ef7119-ea28-4a7a-9329-fcef962e4343	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	61
7872a54a-ca91-4251-ac87-3cb128f43ad3	c1c97976-38c1-4174-b028-57b0273c7fac	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	52
51ffe9ea-f353-4f01-a47c-0ff87e9e2bd3	fd519d52-433b-4bf7-8e7d-e18caeccf843	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	39
63950a09-7dea-413b-9b27-ab710f605560	f3575bed-7b01-4358-bdf2-3d1f81cc2515	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	61
8ef6faf4-4276-4e65-8a2c-b473967ef03b	95465124-34e6-4104-95f7-2f6289016331	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	78
7feecddb-52ce-4ff6-a13d-8e1dde216bcf	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	57
2b6dd29a-21e0-47bc-8be9-79e9bfcda94f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	70
d35e0011-5af2-4c14-89d6-51ec6f4f1fc7	a78272dc-151f-400f-a0b4-1eeec317739c	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	70
e83c04de-28c3-4da6-a5ce-c233a1962eb4	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	65
e4adceef-ec12-4c2f-bc62-a532bf0d8a00	47d8c413-5440-4d05-90cb-0757217fdfaf	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	70
12894940-40c4-4de6-bbcb-9447927f543a	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	65
d5228d10-6508-47f7-8d72-096fc836afa9	d1dce1c9-e82b-4efb-8d22-00117a37b94a	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	96
0f5e9b7c-bba8-47b0-b9c2-0b556aea835b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	96
1b8beb08-7981-4eda-a01c-0a943550caa5	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	100
e71dca70-81a5-4082-84bf-6a33a113ec45	e79979e1-326f-4b84-b613-ce32953d1f05	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	100
54d7caaf-d94c-456f-afed-19c7a762ba90	11c8fe77-61a2-4761-b804-46106525f467	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	96
f791685c-1acd-4015-aaa8-f6bfb96a8607	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	100
adab8ea2-0bf1-4f57-bc8b-61a30a13415e	504a4c9a-95b7-4872-9db9-78483e3e1e60	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	91
aeac8319-27ca-4159-81cd-da93c312ab22	c827a01f-387c-4c59-bfcd-829297a30a74	7e589f4c-041c-4721-8823-937f9a38f058	9	2026	70
727bd8e1-16d1-4f88-91fa-9669f4918569	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	65
3cdd9e99-8e7a-4558-9f10-6f3dbf442ddd	ab8d6a3a-8889-442c-996e-15825a25e37f	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	65
48f5867c-2357-4a68-9aa8-8d7402d30069	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	70
b84722b9-84cd-49bb-8197-12d571b8354a	ae753320-c362-4d8b-8294-53533a1a5798	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	65
50a93c9c-fab5-4b11-9d78-6888ad38178d	f1719575-4aea-4b3e-a61c-b8307ccf9516	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	52
2783c75a-14cd-4be4-bcce-ff54a7821fc7	128691dd-ff65-43d8-8bf4-bb59e2e58617	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	43
ebd9f28c-8717-4b56-a1d0-d2138d53f1a8	65ef7119-ea28-4a7a-9329-fcef962e4343	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	61
57380c1c-d464-4da8-9a8e-e692d669ed30	c1c97976-38c1-4174-b028-57b0273c7fac	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	52
becfc228-63f2-4953-b918-5c33fe4af6e2	fd519d52-433b-4bf7-8e7d-e18caeccf843	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	39
9d29f5c5-fd65-4c80-9a28-b797f429586c	f3575bed-7b01-4358-bdf2-3d1f81cc2515	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	61
5fc8f17c-06e9-4473-87cc-c2e77f1caf4c	95465124-34e6-4104-95f7-2f6289016331	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	78
b3f55ad6-2a1d-4ff3-94bc-91525e2f2850	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	57
2be9f8ea-6f31-4d05-9f34-25649be2c4a9	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	70
dfd810d1-988b-4347-9827-9ed661e5f230	a78272dc-151f-400f-a0b4-1eeec317739c	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	70
6b18178b-c89f-4745-965a-512dba65d621	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	65
d93d87ab-bf2b-4595-8b26-06ed8a3d2c04	47d8c413-5440-4d05-90cb-0757217fdfaf	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	70
33213a54-e389-41ab-9c07-0a3670e40281	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	65
d3d2426c-20af-45c5-915d-e97f63bd0cc8	d1dce1c9-e82b-4efb-8d22-00117a37b94a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	96
942e6069-85b7-432c-8f89-296b01e038d5	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	96
6d993917-fcf6-4817-a7f5-069741143790	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	100
953c7d4e-c832-4a05-b386-d241c45edf19	e79979e1-326f-4b84-b613-ce32953d1f05	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	100
41dd4472-9f7c-4dd0-b720-662ebbb11103	11c8fe77-61a2-4761-b804-46106525f467	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	96
62957bc5-33eb-44f1-8da2-8708f30622ff	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	100
0c2455c2-4e6d-4259-9ad8-ecaa1a9bb52a	504a4c9a-95b7-4872-9db9-78483e3e1e60	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	91
af6989ac-7f2f-46f1-8843-1dfd23b8d183	c827a01f-387c-4c59-bfcd-829297a30a74	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7	2026	70
\.


--
-- Data for Name: AttendanceRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AttendanceRecord" (id, "sessionId", "studentId", status) FROM stdin;
4d2e9418-100f-4a21-b4ea-9e1a72c09e3f	f54f10cb-97ad-4234-a75f-c302f04f47c9	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
e2bd58ac-5c7b-464c-8bf6-41ca5784616e	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
282659fa-6aec-45a1-b856-fb5eaa11e955	e00dec9b-4ee9-4f25-a125-03c806f3556c	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
9e1f18c9-74a2-4cfa-a0f5-84be88314e7a	eacbc2ec-1d49-4099-985d-b0879662b6e4	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
59bcec3f-57cf-4da4-b070-74b02a133cf5	a549e323-bd8e-4df3-9767-83b948c3fea0	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
5de23864-9d5e-4d88-af97-aaddf9599199	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
63e4e0b7-5324-40ea-b1df-3a3ce44a86e4	df736872-f0e0-4fab-bd9b-bf6ec37c6738	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
2081e35e-d6b0-476c-a768-0642b229da95	f42b377d-c608-4523-b690-7f890c9918e0	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
80de988c-862c-4404-a7f5-5463b6c980c6	d38185b6-6436-4e71-98bf-e46862dd84db	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
01e68888-5296-4a6e-862e-ad77085f679d	84948d42-653c-4704-9685-83ceb9ef0292	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
ec3689ea-5d9c-4cd0-a00f-db0c145a193f	d38f1cff-de34-48e0-9d7c-2d8687d6d335	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
f542e4d0-31d4-4dc8-a020-f8823f8cf20c	d796a01a-9e5a-4184-a99f-791487ecc13f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
e8dad7f8-1a0c-4465-ae13-ca77fa6bad56	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
c1202dc8-fe8b-470f-86f3-88cdc424ec03	867977d1-ed38-4338-8e00-d51db1efa8d0	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
7f7fa985-62eb-40ce-825c-f34ac326b52c	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
6fe510df-afcd-4162-b2e7-a4465073dd31	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
3cf7a9dd-188b-4da2-ba6d-b57dd05f2620	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
8e1cd199-fd6b-425a-949c-9bad7ac44167	6fba7b48-d4e6-4870-bebc-f2cf758809b2	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
638c628b-7934-419d-a1c6-feafaf0f1b78	53977b1c-d564-4166-b113-338d5332fc48	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
b2ca6325-eace-4ef4-84ea-8f2bcf484b3a	5b5bfafc-1139-4003-9526-3c5ba6a791b0	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
0ace0535-a4b8-41bc-9615-baa8f75b6eeb	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
bba9f7f0-963e-4d93-9f57-c23d1c5151c0	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
396b4e20-07bb-4416-b121-4f49e62cc89b	45327728-ad89-43be-8445-87c2f73c84b8	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
1d8538a9-9298-4f3b-aeb1-6e7450503e98	f54f10cb-97ad-4234-a75f-c302f04f47c9	ab8d6a3a-8889-442c-996e-15825a25e37f	f
959faf34-2bda-41cf-a72f-e724c84c9ffa	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	ab8d6a3a-8889-442c-996e-15825a25e37f	t
7ae56cef-3e97-47fa-b45a-3c0ab0c94e2f	e00dec9b-4ee9-4f25-a125-03c806f3556c	ab8d6a3a-8889-442c-996e-15825a25e37f	f
fdf9ebb2-bb82-482c-8f3a-385c100fe714	eacbc2ec-1d49-4099-985d-b0879662b6e4	ab8d6a3a-8889-442c-996e-15825a25e37f	f
f86caa85-ef1e-438b-a06a-b4f98ab8705a	a549e323-bd8e-4df3-9767-83b948c3fea0	ab8d6a3a-8889-442c-996e-15825a25e37f	f
2552bbca-ab0c-4fd1-800e-e9eb944e39cd	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	ab8d6a3a-8889-442c-996e-15825a25e37f	t
cea80616-525a-41f6-8471-d9afe346593f	df736872-f0e0-4fab-bd9b-bf6ec37c6738	ab8d6a3a-8889-442c-996e-15825a25e37f	f
0aec5117-cab3-43b2-ba13-5b482511af11	f42b377d-c608-4523-b690-7f890c9918e0	ab8d6a3a-8889-442c-996e-15825a25e37f	f
de7f49f4-8b58-4f2d-9a3f-4727a2f4ebf9	d38185b6-6436-4e71-98bf-e46862dd84db	ab8d6a3a-8889-442c-996e-15825a25e37f	t
107b0165-3c60-4183-8abe-8929aebf16fd	84948d42-653c-4704-9685-83ceb9ef0292	ab8d6a3a-8889-442c-996e-15825a25e37f	t
d6115404-e23e-45b7-a75d-25b1c7cdebce	d38f1cff-de34-48e0-9d7c-2d8687d6d335	ab8d6a3a-8889-442c-996e-15825a25e37f	t
c804946d-0287-4a51-9add-bfc908c99dff	d796a01a-9e5a-4184-a99f-791487ecc13f	ab8d6a3a-8889-442c-996e-15825a25e37f	t
577099ca-584c-41d5-8d72-509bf7b7855a	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	ab8d6a3a-8889-442c-996e-15825a25e37f	t
a0c50f88-d164-46ac-9640-fbfc6576ba29	867977d1-ed38-4338-8e00-d51db1efa8d0	ab8d6a3a-8889-442c-996e-15825a25e37f	t
2411fec7-c893-4561-b42d-ef27325c536a	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	ab8d6a3a-8889-442c-996e-15825a25e37f	t
a5cdd4c8-af0b-491a-b1b1-271c4c4c68fe	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	ab8d6a3a-8889-442c-996e-15825a25e37f	t
3cc78101-06f0-4362-a6b4-a9f81085a9b2	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	ab8d6a3a-8889-442c-996e-15825a25e37f	t
59534fde-5986-43ee-8487-32c3f80be539	6fba7b48-d4e6-4870-bebc-f2cf758809b2	ab8d6a3a-8889-442c-996e-15825a25e37f	f
212e5b15-8ee8-4388-bfb0-60946aaa9420	53977b1c-d564-4166-b113-338d5332fc48	ab8d6a3a-8889-442c-996e-15825a25e37f	t
501abba9-7a00-410b-8dc3-344389ab7050	5b5bfafc-1139-4003-9526-3c5ba6a791b0	ab8d6a3a-8889-442c-996e-15825a25e37f	t
54f88acf-6eba-4e91-bdf6-38571964102c	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	ab8d6a3a-8889-442c-996e-15825a25e37f	f
0b478a22-be1e-42b1-abb4-abcaa96b45e0	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	ab8d6a3a-8889-442c-996e-15825a25e37f	t
29539665-c758-461c-9d37-7ca6fb22411a	45327728-ad89-43be-8445-87c2f73c84b8	ab8d6a3a-8889-442c-996e-15825a25e37f	t
f4e85094-4878-412b-8026-59a3ae60010f	f54f10cb-97ad-4234-a75f-c302f04f47c9	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
e57b1206-414e-4331-9beb-f6f65c7d2bfc	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
e45377ba-5138-46dd-8d16-17d49e3eb698	e00dec9b-4ee9-4f25-a125-03c806f3556c	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
59175a7c-a3e5-4735-b8d9-bd524fc83a45	eacbc2ec-1d49-4099-985d-b0879662b6e4	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
b8cd968c-f188-429e-aaaa-466d229abfd9	a549e323-bd8e-4df3-9767-83b948c3fea0	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
01b40523-3524-4568-9bdb-a8b0ea917bf1	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
d4941e18-1904-4389-b66a-ca759d41bfc3	df736872-f0e0-4fab-bd9b-bf6ec37c6738	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
57ad790a-7019-4b2e-bcd2-00e1228acbe1	f42b377d-c608-4523-b690-7f890c9918e0	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
2768f794-41a1-4715-bfc8-ce99d8ba45c4	d38185b6-6436-4e71-98bf-e46862dd84db	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
bd4453b2-ddcb-4dfb-aa84-0ca84716caa3	84948d42-653c-4704-9685-83ceb9ef0292	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
36c96514-1b1a-40d4-a05e-bafa5b33b2cb	d38f1cff-de34-48e0-9d7c-2d8687d6d335	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
271dfd67-e206-4d4e-b876-b8e1172b23a5	d796a01a-9e5a-4184-a99f-791487ecc13f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
73532a1a-2ac1-4866-800c-dc0739f47d77	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
de9fc8ef-da26-43c6-962e-e6a80ab4a054	867977d1-ed38-4338-8e00-d51db1efa8d0	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
2acf065a-5770-469a-9e1c-686059ef79c8	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
96fc823b-aa36-4e91-8ec3-7687e9160166	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
367fef18-b7d2-4240-9278-e0e1779b4ff1	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
9532096e-28dc-428a-81e2-08fcae73921b	6fba7b48-d4e6-4870-bebc-f2cf758809b2	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
07a600fe-e932-446f-8e01-d9e6e004a190	53977b1c-d564-4166-b113-338d5332fc48	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
391c8c05-a43a-4a11-9c71-176df695e8b3	5b5bfafc-1139-4003-9526-3c5ba6a791b0	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
94c9ae12-23bd-456d-8284-706c275f370d	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
af2e8382-1a13-4982-b42c-3f867ac3211c	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
babecca8-0674-46d3-96a0-d0096363485d	45327728-ad89-43be-8445-87c2f73c84b8	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
af42c75c-33d2-4e4b-a9f0-365624ef5d73	f54f10cb-97ad-4234-a75f-c302f04f47c9	ae753320-c362-4d8b-8294-53533a1a5798	f
a4c6da11-9f1d-476d-a8fd-5360da8c3567	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	ae753320-c362-4d8b-8294-53533a1a5798	t
98a609f6-8c74-4ed1-b51d-27e532c7ef8f	e00dec9b-4ee9-4f25-a125-03c806f3556c	ae753320-c362-4d8b-8294-53533a1a5798	t
3f2e26ea-de95-4bf2-ab52-7f85c282bbd6	eacbc2ec-1d49-4099-985d-b0879662b6e4	ae753320-c362-4d8b-8294-53533a1a5798	f
25865368-0398-4fba-8aeb-524230caa83e	a549e323-bd8e-4df3-9767-83b948c3fea0	ae753320-c362-4d8b-8294-53533a1a5798	t
22697363-40f6-4552-b9ed-dc5972330fb2	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	ae753320-c362-4d8b-8294-53533a1a5798	t
138a77fa-33cf-4591-a969-ca0f03d3b449	df736872-f0e0-4fab-bd9b-bf6ec37c6738	ae753320-c362-4d8b-8294-53533a1a5798	t
de207383-d845-411f-b112-c2202910aea5	f42b377d-c608-4523-b690-7f890c9918e0	ae753320-c362-4d8b-8294-53533a1a5798	f
dd6f7bfc-aec6-469b-9ae1-4350773ff7f4	d38185b6-6436-4e71-98bf-e46862dd84db	ae753320-c362-4d8b-8294-53533a1a5798	t
744b5aef-fc25-471f-9bad-c985adace07e	84948d42-653c-4704-9685-83ceb9ef0292	ae753320-c362-4d8b-8294-53533a1a5798	t
fe65e463-af61-4a14-9e9a-9a3a3de8b268	d38f1cff-de34-48e0-9d7c-2d8687d6d335	ae753320-c362-4d8b-8294-53533a1a5798	t
16479e20-5c9f-4c23-ba8d-87657d430cfd	d796a01a-9e5a-4184-a99f-791487ecc13f	ae753320-c362-4d8b-8294-53533a1a5798	f
444b23ed-d277-4b5b-9eb2-bc0331caca49	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	ae753320-c362-4d8b-8294-53533a1a5798	t
692eae12-42b6-4226-b566-ae692ae43673	867977d1-ed38-4338-8e00-d51db1efa8d0	ae753320-c362-4d8b-8294-53533a1a5798	t
b393d8c7-4ef1-4f83-a403-61569f917cd0	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	ae753320-c362-4d8b-8294-53533a1a5798	f
14200617-01bb-4686-8e10-4bcb26d63478	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	ae753320-c362-4d8b-8294-53533a1a5798	f
bf1b7537-5fcf-4fc0-b464-3b2d7b55a65f	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	ae753320-c362-4d8b-8294-53533a1a5798	f
547564ba-9afc-4deb-9a2e-81013d0e15b4	6fba7b48-d4e6-4870-bebc-f2cf758809b2	ae753320-c362-4d8b-8294-53533a1a5798	f
f2f24dc6-77f3-4cd5-b2e0-ab00fa4af4c0	53977b1c-d564-4166-b113-338d5332fc48	ae753320-c362-4d8b-8294-53533a1a5798	t
06d74eab-e30e-4ace-9030-1fb1dceecd75	5b5bfafc-1139-4003-9526-3c5ba6a791b0	ae753320-c362-4d8b-8294-53533a1a5798	t
f94c78d6-5a7c-4953-811b-f321bd3f5609	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	ae753320-c362-4d8b-8294-53533a1a5798	t
6afb9586-ae99-49d3-8ba2-87d272d35194	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	ae753320-c362-4d8b-8294-53533a1a5798	t
0d574558-1c1e-401c-9284-a6c01c140596	45327728-ad89-43be-8445-87c2f73c84b8	ae753320-c362-4d8b-8294-53533a1a5798	t
e2fa0f17-664e-4cfc-aabf-8c824cd2955c	f54f10cb-97ad-4234-a75f-c302f04f47c9	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
3f342c1d-c328-414f-b330-df7813d541e1	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
2cb98b01-912b-4f02-96d1-55a5d6d9908d	e00dec9b-4ee9-4f25-a125-03c806f3556c	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
392c8957-cefc-4f93-b032-7f32efb305ef	eacbc2ec-1d49-4099-985d-b0879662b6e4	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
d0f70ed8-eb42-4b1c-a166-54e3eeef7c7a	a549e323-bd8e-4df3-9767-83b948c3fea0	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
775391d9-f2dc-49d1-a160-c46c73b43ca6	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
f3308223-a6a4-4bc5-841d-293f714dbb46	df736872-f0e0-4fab-bd9b-bf6ec37c6738	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
ccd80f70-bd44-454d-bd4a-ff163ff95b21	f42b377d-c608-4523-b690-7f890c9918e0	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
531f21f6-6711-449d-9e96-8eff838daa4b	d38185b6-6436-4e71-98bf-e46862dd84db	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
9c8ee261-c678-4996-97ae-918330a643c7	84948d42-653c-4704-9685-83ceb9ef0292	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
4c9bce30-4a4a-45a5-a289-edf0f75c8e65	d38f1cff-de34-48e0-9d7c-2d8687d6d335	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
01219094-b8ac-4b13-a7b2-5d58ac4fdd51	d796a01a-9e5a-4184-a99f-791487ecc13f	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
9cceaa19-5cd0-4581-b77a-d5bdfe2528b1	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
83b86823-89cc-4d8a-8c16-46351f1f5a1a	867977d1-ed38-4338-8e00-d51db1efa8d0	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
81f6708e-b2f3-4efb-901d-c2fc7ec44139	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
0a897193-a4cd-420e-94e6-d989b69f72f7	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
c2196be4-bb35-46ae-8a2f-ee8ad1cb7325	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
3d9170e1-7b2b-4441-9286-f29abb3618ac	6fba7b48-d4e6-4870-bebc-f2cf758809b2	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
87f66c41-9dc2-4f74-9545-1c7b3fa8a8fe	53977b1c-d564-4166-b113-338d5332fc48	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
6351be52-7f6f-415f-9dd0-9cefe4eeeea3	5b5bfafc-1139-4003-9526-3c5ba6a791b0	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
51afb3ed-c42e-4f72-912d-b5173e9ad2eb	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
26ddd6ac-2664-4789-8f09-5e865209b310	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
83cf923d-6634-419f-ad18-ba11c3c003ff	45327728-ad89-43be-8445-87c2f73c84b8	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
1113f34f-4ad9-4a87-a42c-f5a925287b04	f54f10cb-97ad-4234-a75f-c302f04f47c9	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
78754e94-b7fe-4784-a388-3c84a962c124	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
712b9314-9213-480e-bd76-4c6d98f94fbf	e00dec9b-4ee9-4f25-a125-03c806f3556c	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
5a86a571-c5e4-4131-92e1-d8d24cf43997	eacbc2ec-1d49-4099-985d-b0879662b6e4	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
2c6dbd0f-aabc-4e2a-ae5a-7bf45e85f5c7	a549e323-bd8e-4df3-9767-83b948c3fea0	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
555da669-fdb3-4af8-bcdd-0f345af537ca	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
202d18dd-bd16-4289-88e0-ec43500b0198	df736872-f0e0-4fab-bd9b-bf6ec37c6738	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
627073e9-2213-40a9-8cb4-0fe2fbc64c7e	f42b377d-c608-4523-b690-7f890c9918e0	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
54c143fc-a05a-4705-9296-122c75d2d391	d38185b6-6436-4e71-98bf-e46862dd84db	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
06d512a2-f912-4fe2-99d0-eee913d6c4f7	84948d42-653c-4704-9685-83ceb9ef0292	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
7697828a-f096-4e44-8169-1d7aa61a46c1	d38f1cff-de34-48e0-9d7c-2d8687d6d335	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
fdfc0c97-9a77-4657-b52c-13f5f0878245	d796a01a-9e5a-4184-a99f-791487ecc13f	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
4bccc405-8a4b-4089-97f3-e899bd388b4e	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
3b95c7c7-6c89-4997-8c64-9a85f0ecaa93	867977d1-ed38-4338-8e00-d51db1efa8d0	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
a16f3874-0882-4a9e-b002-c9bc37cae3a0	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
f5d70d7c-50b2-4845-bd9c-c7152c08fab0	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
7bc25896-16b5-4a83-a02e-6017429a84c4	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
3668711f-056f-4ddc-9ffb-eb3dae145aae	6fba7b48-d4e6-4870-bebc-f2cf758809b2	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
44b1ecf9-2170-49f3-a332-2c4e40d4ea93	53977b1c-d564-4166-b113-338d5332fc48	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
141aee12-4bb8-46af-aa96-45737d024bc9	5b5bfafc-1139-4003-9526-3c5ba6a791b0	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
66bc09ee-b895-4974-ac64-b8b631091a0b	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
52f58d47-361a-472c-b358-0754aa4fc935	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
bc3ced42-b648-453e-af5c-688741a24716	45327728-ad89-43be-8445-87c2f73c84b8	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
daa8e781-3e24-4c06-8d1f-95524e6fb2cb	f54f10cb-97ad-4234-a75f-c302f04f47c9	65ef7119-ea28-4a7a-9329-fcef962e4343	f
4bd5b44b-0cf4-4f33-bd98-9e27ed9798a4	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	65ef7119-ea28-4a7a-9329-fcef962e4343	t
5e085d56-491d-42cb-8cac-125bc81cf1f9	e00dec9b-4ee9-4f25-a125-03c806f3556c	65ef7119-ea28-4a7a-9329-fcef962e4343	t
01609824-65ea-4568-864e-9e0e850b7961	eacbc2ec-1d49-4099-985d-b0879662b6e4	65ef7119-ea28-4a7a-9329-fcef962e4343	t
e07599ce-4946-4d03-91f4-f41bfcca36ac	a549e323-bd8e-4df3-9767-83b948c3fea0	65ef7119-ea28-4a7a-9329-fcef962e4343	t
023916ed-5762-448d-aa85-88b8df3c6fb7	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	65ef7119-ea28-4a7a-9329-fcef962e4343	t
599cb44f-cdd9-418a-9d38-7b9fefeda406	df736872-f0e0-4fab-bd9b-bf6ec37c6738	65ef7119-ea28-4a7a-9329-fcef962e4343	t
64ade1c1-a4dd-47c0-a8be-293809c5cc97	f42b377d-c608-4523-b690-7f890c9918e0	65ef7119-ea28-4a7a-9329-fcef962e4343	f
d13e1cc6-7ef4-4f3f-aae0-293c69e5121b	d38185b6-6436-4e71-98bf-e46862dd84db	65ef7119-ea28-4a7a-9329-fcef962e4343	t
18ce0d49-de2f-45fa-822d-613a377c4990	84948d42-653c-4704-9685-83ceb9ef0292	65ef7119-ea28-4a7a-9329-fcef962e4343	f
8634f817-7e3d-4463-832e-6f7f7069becc	d38f1cff-de34-48e0-9d7c-2d8687d6d335	65ef7119-ea28-4a7a-9329-fcef962e4343	t
c4cafc3f-c611-47e8-8392-e86ce7f1ada0	d796a01a-9e5a-4184-a99f-791487ecc13f	65ef7119-ea28-4a7a-9329-fcef962e4343	t
80142cda-d56a-4e50-9427-7f050a2ee11e	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	65ef7119-ea28-4a7a-9329-fcef962e4343	t
df6ce095-9690-4cf8-bd8e-7d44ee581004	867977d1-ed38-4338-8e00-d51db1efa8d0	65ef7119-ea28-4a7a-9329-fcef962e4343	f
11b24462-6ebc-4a8e-9114-7e3df8c1a716	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	65ef7119-ea28-4a7a-9329-fcef962e4343	t
c2d1722c-37df-4ff1-b0c4-ffa4f82f1e91	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	65ef7119-ea28-4a7a-9329-fcef962e4343	f
cd6c98e1-cf4a-40c8-9cb0-ac8c05fb034b	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	65ef7119-ea28-4a7a-9329-fcef962e4343	f
687dcedf-088f-463f-9667-8892e328c31c	6fba7b48-d4e6-4870-bebc-f2cf758809b2	65ef7119-ea28-4a7a-9329-fcef962e4343	f
b45e5f21-c85e-4da7-975a-54ac61a3d452	53977b1c-d564-4166-b113-338d5332fc48	65ef7119-ea28-4a7a-9329-fcef962e4343	f
c966173b-b3c5-46a8-9afe-feabe7bc9df1	5b5bfafc-1139-4003-9526-3c5ba6a791b0	65ef7119-ea28-4a7a-9329-fcef962e4343	f
7b45af48-1a3c-439f-a82d-ea221a1e263f	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	65ef7119-ea28-4a7a-9329-fcef962e4343	t
cfba0fd6-530c-4d63-bf46-6ef619f3a57c	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	65ef7119-ea28-4a7a-9329-fcef962e4343	t
602e0d4b-1d11-481d-935e-b3ab03a436c6	45327728-ad89-43be-8445-87c2f73c84b8	65ef7119-ea28-4a7a-9329-fcef962e4343	t
9a24e82a-6797-4ab1-ac6d-5456f2356294	f54f10cb-97ad-4234-a75f-c302f04f47c9	c1c97976-38c1-4174-b028-57b0273c7fac	f
3632931e-94fa-4e9b-b2b2-56a0aec68aa9	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	c1c97976-38c1-4174-b028-57b0273c7fac	t
ebf9d43f-3cca-4038-8145-4d53adfbb974	e00dec9b-4ee9-4f25-a125-03c806f3556c	c1c97976-38c1-4174-b028-57b0273c7fac	f
347fb111-0e41-427b-9f25-d11776449737	eacbc2ec-1d49-4099-985d-b0879662b6e4	c1c97976-38c1-4174-b028-57b0273c7fac	t
e6d1f1d5-fbc6-436b-8123-1e4662acdcf2	a549e323-bd8e-4df3-9767-83b948c3fea0	c1c97976-38c1-4174-b028-57b0273c7fac	f
00622bf8-ce53-4092-bdb9-962e79dbdb5d	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	c1c97976-38c1-4174-b028-57b0273c7fac	t
fed313cb-c86a-49c1-bed0-528eacd7eb67	df736872-f0e0-4fab-bd9b-bf6ec37c6738	c1c97976-38c1-4174-b028-57b0273c7fac	t
0324a407-1689-4cc3-859a-2bc88e988091	f42b377d-c608-4523-b690-7f890c9918e0	c1c97976-38c1-4174-b028-57b0273c7fac	f
dc68de14-e4cb-4a92-a398-7f47716bfdc8	d38185b6-6436-4e71-98bf-e46862dd84db	c1c97976-38c1-4174-b028-57b0273c7fac	t
6a1e9be2-a3b1-4bfc-9816-8c1e5ed93277	84948d42-653c-4704-9685-83ceb9ef0292	c1c97976-38c1-4174-b028-57b0273c7fac	t
8ef8374f-d618-4b20-b002-215c9aad566c	d38f1cff-de34-48e0-9d7c-2d8687d6d335	c1c97976-38c1-4174-b028-57b0273c7fac	t
43bea4b5-bfa5-4f12-8428-071818cdf4c9	d796a01a-9e5a-4184-a99f-791487ecc13f	c1c97976-38c1-4174-b028-57b0273c7fac	t
d2be16ac-62ee-44c6-bd6f-7dc0faca4ddb	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	c1c97976-38c1-4174-b028-57b0273c7fac	f
92c5ff1a-067a-4cb5-8d2e-24612bea82da	867977d1-ed38-4338-8e00-d51db1efa8d0	c1c97976-38c1-4174-b028-57b0273c7fac	f
605fe234-601f-4645-99b7-e43b467ee48e	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	c1c97976-38c1-4174-b028-57b0273c7fac	t
1586442b-b122-44bd-832a-9b1879af948e	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	c1c97976-38c1-4174-b028-57b0273c7fac	f
ebc366e1-60bd-47e9-95a3-a80d3803bdb7	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	c1c97976-38c1-4174-b028-57b0273c7fac	f
98dfdfe6-69ee-41d6-8583-d4d394254171	6fba7b48-d4e6-4870-bebc-f2cf758809b2	c1c97976-38c1-4174-b028-57b0273c7fac	f
69b89353-79ff-401e-9db0-dfae00a2ae1f	53977b1c-d564-4166-b113-338d5332fc48	c1c97976-38c1-4174-b028-57b0273c7fac	f
bac606d4-71b0-4915-bff3-9019c7d5b1d4	5b5bfafc-1139-4003-9526-3c5ba6a791b0	c1c97976-38c1-4174-b028-57b0273c7fac	t
1e17a26f-0ef3-4f9f-b7e3-f8e73045abd2	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	c1c97976-38c1-4174-b028-57b0273c7fac	f
cc56f8df-77a5-4f04-aa6f-ca198a7791be	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	c1c97976-38c1-4174-b028-57b0273c7fac	t
ea98874b-1ee8-48bd-ac98-9c7064e18633	45327728-ad89-43be-8445-87c2f73c84b8	c1c97976-38c1-4174-b028-57b0273c7fac	t
719294cc-7782-45e7-b0ff-8301bb7252de	f54f10cb-97ad-4234-a75f-c302f04f47c9	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
fd35d765-f2a6-422c-b3ff-49295f321166	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
207f08b8-327e-461e-a242-0be4da34f169	e00dec9b-4ee9-4f25-a125-03c806f3556c	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
a3d0d072-0c70-48d6-8530-e066b42d635f	eacbc2ec-1d49-4099-985d-b0879662b6e4	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
de9860c3-61d7-4cf3-af3d-0bb8b04c9f56	a549e323-bd8e-4df3-9767-83b948c3fea0	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
12ebb137-092c-41a2-9612-a8833c29f602	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
51285446-748f-4d4c-8901-1d5ec150058a	df736872-f0e0-4fab-bd9b-bf6ec37c6738	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
558137cf-49a4-427a-8002-20b671738705	f42b377d-c608-4523-b690-7f890c9918e0	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
a0467ed1-31a1-4165-b236-66701c62d665	d38185b6-6436-4e71-98bf-e46862dd84db	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
3b2349b7-394b-4c5f-b0b1-373d8c62d0bf	84948d42-653c-4704-9685-83ceb9ef0292	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
03281015-1a3b-422f-b819-445f64322410	d38f1cff-de34-48e0-9d7c-2d8687d6d335	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
0ace66cf-e60e-4063-b9f0-29ce642298c5	d796a01a-9e5a-4184-a99f-791487ecc13f	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
5786c41f-a792-4837-a1db-17d303d0b46f	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
004c1ad7-cd7f-45d1-87d1-74ad399228ee	867977d1-ed38-4338-8e00-d51db1efa8d0	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
a8eb5991-dcae-495a-9328-7e2dc7db0f58	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
65581a84-0c77-4eb9-8b61-ecb959bf9911	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
9735d0b6-7ac8-4a13-a940-a41e4b4a22ca	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
f880efcf-7762-4906-b7df-db6836bba765	6fba7b48-d4e6-4870-bebc-f2cf758809b2	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
e97fc19f-4e9d-4519-9148-230b163a0590	53977b1c-d564-4166-b113-338d5332fc48	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
7f965cc2-c509-4a21-912b-9f571f534b6f	5b5bfafc-1139-4003-9526-3c5ba6a791b0	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
981a2a84-1264-4b64-8907-cdf80e50d2f5	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
62d84cc1-65ff-45d4-8ac9-c237fb637cca	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
1317c66a-02a3-4755-9083-0f97db0acb27	45327728-ad89-43be-8445-87c2f73c84b8	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
5deca6f8-1378-4a2b-8d82-d6a03927cc5d	f54f10cb-97ad-4234-a75f-c302f04f47c9	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
da1a28ec-9e25-4cf3-8646-e0b2dcbef186	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
95a7d145-10b1-4857-acb9-d4bd907635c8	e00dec9b-4ee9-4f25-a125-03c806f3556c	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
0bd733e1-95b6-43c6-acc9-4e42738b4b2d	eacbc2ec-1d49-4099-985d-b0879662b6e4	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
6b99efba-07ee-4149-bdaf-2c6975f54b22	a549e323-bd8e-4df3-9767-83b948c3fea0	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
37174c01-c987-4323-8163-4c512251d5ac	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
a3ea7724-e068-41a6-a720-4c1562bfee48	df736872-f0e0-4fab-bd9b-bf6ec37c6738	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
95446d1d-34b3-4167-9828-4356b7fc8977	f42b377d-c608-4523-b690-7f890c9918e0	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
2549cb77-8d65-4cd8-9c50-b28020dbce7c	d38185b6-6436-4e71-98bf-e46862dd84db	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
cb92de3d-0009-41f9-b96b-88fe7b7d1c4d	84948d42-653c-4704-9685-83ceb9ef0292	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
7a2dca00-10e4-4ca6-863a-ded235aed9b5	d38f1cff-de34-48e0-9d7c-2d8687d6d335	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
8f88c7ff-d911-420c-8b0d-314b57e0fb2f	d796a01a-9e5a-4184-a99f-791487ecc13f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
6ab94e2b-5bfd-4572-bb90-cb2ae93b0c1f	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
0ff24d66-62fc-4f77-9375-89669dfbe06f	867977d1-ed38-4338-8e00-d51db1efa8d0	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
41b6bc39-4b3c-4d6e-bc80-866f2a895325	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
357968fc-a741-46d0-b076-b85c2013ae69	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
6cd266a3-234d-477f-aab3-0c5d77e33905	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
0a187b5e-aded-47de-92d8-072c23edc99e	6fba7b48-d4e6-4870-bebc-f2cf758809b2	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
bf5a3f30-9b42-480b-82dc-ac4f6e857296	53977b1c-d564-4166-b113-338d5332fc48	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
25b8c5d5-d374-4d0f-862c-cc8c224789c7	5b5bfafc-1139-4003-9526-3c5ba6a791b0	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
8156c0b7-bf54-49a5-8a0e-09d676f9e6cb	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
434b0a36-09a4-457f-a547-fb92a4b13e95	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
9d28034d-7c38-41ae-ab93-80e0eb8e8360	45327728-ad89-43be-8445-87c2f73c84b8	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
2df07973-f999-43cd-bf99-2fa3ffcf38d1	f54f10cb-97ad-4234-a75f-c302f04f47c9	95465124-34e6-4104-95f7-2f6289016331	f
9021c7fa-bcdb-41ec-9ad9-9c19a6530e14	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	95465124-34e6-4104-95f7-2f6289016331	t
d2223f20-9f06-4ea2-8e7b-22c57e4cf205	e00dec9b-4ee9-4f25-a125-03c806f3556c	95465124-34e6-4104-95f7-2f6289016331	t
cec7c615-6645-422e-bc30-b884ccd04fb6	eacbc2ec-1d49-4099-985d-b0879662b6e4	95465124-34e6-4104-95f7-2f6289016331	t
b88ee05b-881b-4583-a64f-8f7984f7b0ac	a549e323-bd8e-4df3-9767-83b948c3fea0	95465124-34e6-4104-95f7-2f6289016331	t
7fdc1804-ed4b-4c1a-a635-5b1a46971b6e	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	95465124-34e6-4104-95f7-2f6289016331	t
f9722dbd-8e43-419c-83db-689185331941	df736872-f0e0-4fab-bd9b-bf6ec37c6738	95465124-34e6-4104-95f7-2f6289016331	t
854bcc43-864e-467f-b55c-f9a00f273d7a	f42b377d-c608-4523-b690-7f890c9918e0	95465124-34e6-4104-95f7-2f6289016331	t
50b899d2-6d64-48cd-afbf-a1d7197d639a	d38185b6-6436-4e71-98bf-e46862dd84db	95465124-34e6-4104-95f7-2f6289016331	t
ebab6e99-9e48-4402-833e-bf26ff512267	84948d42-653c-4704-9685-83ceb9ef0292	95465124-34e6-4104-95f7-2f6289016331	t
749135d9-4b91-4850-b94d-0c6b3189c0d2	d38f1cff-de34-48e0-9d7c-2d8687d6d335	95465124-34e6-4104-95f7-2f6289016331	t
d5fe8471-45f4-4ef2-aa3d-688929f78da5	d796a01a-9e5a-4184-a99f-791487ecc13f	95465124-34e6-4104-95f7-2f6289016331	t
22b1aaf4-4fd3-4783-b297-4f92627f431f	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	95465124-34e6-4104-95f7-2f6289016331	t
8413641e-f9e5-4cdb-906e-9346f4b5461a	867977d1-ed38-4338-8e00-d51db1efa8d0	95465124-34e6-4104-95f7-2f6289016331	t
88733082-75e8-47e3-8299-5c9f7f50b969	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	95465124-34e6-4104-95f7-2f6289016331	f
88ea535d-b663-4547-9f32-aa927d7586ca	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	95465124-34e6-4104-95f7-2f6289016331	f
11a9a7cb-7a9b-4774-ae8e-0f8f33f03695	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	95465124-34e6-4104-95f7-2f6289016331	t
6800d56a-d21b-4cd2-b6dd-bdb051bcc5f1	6fba7b48-d4e6-4870-bebc-f2cf758809b2	95465124-34e6-4104-95f7-2f6289016331	t
916f208a-a388-41a0-82a2-6ec8122d56d7	53977b1c-d564-4166-b113-338d5332fc48	95465124-34e6-4104-95f7-2f6289016331	t
87788abf-bcd6-4015-a409-284091fa6fc3	5b5bfafc-1139-4003-9526-3c5ba6a791b0	95465124-34e6-4104-95f7-2f6289016331	f
111340c1-9b2c-4af8-b19b-ccfe2ccf5c38	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	95465124-34e6-4104-95f7-2f6289016331	f
f014ecb4-f038-4bc7-b566-8ab3be0682be	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	95465124-34e6-4104-95f7-2f6289016331	t
a14ad42a-0430-4de7-bfb0-53d03e1d7785	45327728-ad89-43be-8445-87c2f73c84b8	95465124-34e6-4104-95f7-2f6289016331	t
802d03d9-e540-467e-b984-eec23c1b39b9	f54f10cb-97ad-4234-a75f-c302f04f47c9	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
44ae8d6f-4827-444f-94fe-cbd7286c39bb	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
8025c411-0ef9-44c4-a483-078bc572a259	e00dec9b-4ee9-4f25-a125-03c806f3556c	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
8f5d9d16-9663-4f52-9a5e-8ff850c9531c	eacbc2ec-1d49-4099-985d-b0879662b6e4	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
a5b243e2-118e-410b-a9bc-4b0695ed77d7	a549e323-bd8e-4df3-9767-83b948c3fea0	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
61e1f7ae-e95b-40bc-a9d5-3e1526192465	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
8f0bcd00-286f-4593-ab17-da227e607065	df736872-f0e0-4fab-bd9b-bf6ec37c6738	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
073928d2-14b9-437e-a271-3d71ee09231d	f42b377d-c608-4523-b690-7f890c9918e0	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
df465772-44d5-433f-bbe0-c34934fb7c94	d38185b6-6436-4e71-98bf-e46862dd84db	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
521182db-403e-4372-9815-930b8b9527a7	84948d42-653c-4704-9685-83ceb9ef0292	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
e8ee713f-0a9c-49a9-ae44-35ea29f5a943	d38f1cff-de34-48e0-9d7c-2d8687d6d335	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
147ee846-a63e-4f18-bfbc-99ec66f8cf58	d796a01a-9e5a-4184-a99f-791487ecc13f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
13bc9250-6196-4f62-82ac-fab7dc62f7cd	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
aa73a329-9911-4316-a80b-8dc076186324	867977d1-ed38-4338-8e00-d51db1efa8d0	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
08edc115-5f4b-45de-b371-89342a577fcb	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
9af6d4eb-6d3a-4558-9fab-380f7481ded3	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
bf988530-a106-4f83-b3ae-f43ebfa1b850	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
35131769-692d-41c5-aab1-857223e69d6a	6fba7b48-d4e6-4870-bebc-f2cf758809b2	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
61930de3-677a-45b6-bbed-d48daf0daa60	53977b1c-d564-4166-b113-338d5332fc48	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
72973b2d-f031-4bfd-838d-edb94878f919	5b5bfafc-1139-4003-9526-3c5ba6a791b0	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
616f6a46-af0e-42a2-b0bd-1ee4137b2097	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
c2c16900-dae7-49a5-a240-3eb4a526efb7	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
6759c95f-0f53-46eb-aa16-799cb7294156	45327728-ad89-43be-8445-87c2f73c84b8	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
bb65a63e-47de-42dd-9f20-97b53692e08c	f54f10cb-97ad-4234-a75f-c302f04f47c9	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
3ecbc971-f40c-4c7d-89ab-0b4f0a0c3b46	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
ca8c9f8a-755e-48c8-b03e-05da5f5906e6	e00dec9b-4ee9-4f25-a125-03c806f3556c	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
729d0cca-99f0-4c67-b530-18ea98af079d	eacbc2ec-1d49-4099-985d-b0879662b6e4	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
dc3fe528-df6b-4e08-a4df-061c6b69d77e	a549e323-bd8e-4df3-9767-83b948c3fea0	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
f033dd60-f788-4885-b53a-0924be8f380a	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
e051021d-4a06-415a-900d-b55ff49841c0	df736872-f0e0-4fab-bd9b-bf6ec37c6738	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
5a0bbcc3-9823-4263-ba58-5eb670cf81cf	f42b377d-c608-4523-b690-7f890c9918e0	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
d389b7f8-0bdb-41fe-9f2a-49eedf085df1	d38185b6-6436-4e71-98bf-e46862dd84db	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
4c8b32b7-b053-4239-ae91-a064a06e55e0	84948d42-653c-4704-9685-83ceb9ef0292	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
9a8592b5-5c8e-42a2-a777-fce34996be29	d38f1cff-de34-48e0-9d7c-2d8687d6d335	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
51fa2978-12a9-401d-85ee-6c7f120311ef	d796a01a-9e5a-4184-a99f-791487ecc13f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
c9a998ce-1d51-4b52-9a2b-c61d851d648a	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
5ec9c041-043c-438d-b6a3-283c9eba4eca	867977d1-ed38-4338-8e00-d51db1efa8d0	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
11e10fa2-3241-430f-b0a5-9c27cc1b745e	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
02c9fe78-54a5-4745-b347-862f6c0cf54a	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
0834bc52-076c-4b0e-84ba-d0f71e436679	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
ad91581c-a8e5-4675-8591-eb14b3e1d18c	6fba7b48-d4e6-4870-bebc-f2cf758809b2	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
074c8bb1-e0dc-494c-9d1d-2423af95b043	53977b1c-d564-4166-b113-338d5332fc48	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
3b4a0e3e-ee66-406b-a3fc-7af387b50f6f	5b5bfafc-1139-4003-9526-3c5ba6a791b0	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
0e3f8375-ef1c-4e30-8221-e06e7a33c8da	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
3dbe3d4c-01ca-4692-9894-e7a524c9c3b0	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
0e2526cf-8d01-4f0e-b9b9-a63ce30b991f	45327728-ad89-43be-8445-87c2f73c84b8	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
0ce442b2-41d8-4c5b-9a6d-9730f7ce7052	f54f10cb-97ad-4234-a75f-c302f04f47c9	a78272dc-151f-400f-a0b4-1eeec317739c	t
4b8e9964-4aab-4aed-b73c-6d0849bdfd71	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	a78272dc-151f-400f-a0b4-1eeec317739c	f
22514c54-bc5f-45d5-85ee-38b615e8a538	e00dec9b-4ee9-4f25-a125-03c806f3556c	a78272dc-151f-400f-a0b4-1eeec317739c	f
57d6547c-6a7c-4cd3-ae1e-2cb340152330	eacbc2ec-1d49-4099-985d-b0879662b6e4	a78272dc-151f-400f-a0b4-1eeec317739c	f
905fe03f-12a5-4f69-b98b-b32da517b8aa	a549e323-bd8e-4df3-9767-83b948c3fea0	a78272dc-151f-400f-a0b4-1eeec317739c	f
f742e469-27cb-4570-b1ba-e8f0d3ed62b0	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	a78272dc-151f-400f-a0b4-1eeec317739c	f
60cb92b9-7d1e-4db0-bb57-b6362c272c13	df736872-f0e0-4fab-bd9b-bf6ec37c6738	a78272dc-151f-400f-a0b4-1eeec317739c	f
b9bb9b1c-f10f-4423-9ecb-32b38c049d22	f42b377d-c608-4523-b690-7f890c9918e0	a78272dc-151f-400f-a0b4-1eeec317739c	f
30f1cb6e-d8a2-4531-80eb-835425eb7a22	d38185b6-6436-4e71-98bf-e46862dd84db	a78272dc-151f-400f-a0b4-1eeec317739c	t
608cc8a8-dd6d-4068-86b6-b9756c664b7c	84948d42-653c-4704-9685-83ceb9ef0292	a78272dc-151f-400f-a0b4-1eeec317739c	t
096ea3a9-d51b-472b-9c62-ed316ab0f519	d38f1cff-de34-48e0-9d7c-2d8687d6d335	a78272dc-151f-400f-a0b4-1eeec317739c	t
1a1f4c10-c53a-48ff-9cb1-8016815ab4d0	d796a01a-9e5a-4184-a99f-791487ecc13f	a78272dc-151f-400f-a0b4-1eeec317739c	t
5c2c8f4d-bffa-4b6a-a4fa-460ff8a100a2	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	a78272dc-151f-400f-a0b4-1eeec317739c	t
41fdf15d-9372-4d03-aaa9-f0f904476924	867977d1-ed38-4338-8e00-d51db1efa8d0	a78272dc-151f-400f-a0b4-1eeec317739c	t
c776be89-3aba-49cd-8025-c3403c4626da	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	a78272dc-151f-400f-a0b4-1eeec317739c	t
64367f72-7779-4886-b8db-26648c43d66d	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	a78272dc-151f-400f-a0b4-1eeec317739c	t
115610df-a6bf-4eb6-89f0-cd7a8701e02b	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	a78272dc-151f-400f-a0b4-1eeec317739c	t
52c49d4a-d8d4-4718-ac53-74523bfee38b	6fba7b48-d4e6-4870-bebc-f2cf758809b2	a78272dc-151f-400f-a0b4-1eeec317739c	t
bc2a5d2f-bc9b-407c-b3dd-1886ab9eb94f	53977b1c-d564-4166-b113-338d5332fc48	a78272dc-151f-400f-a0b4-1eeec317739c	t
71c283c9-72cf-40bc-9998-a5f954f40a84	5b5bfafc-1139-4003-9526-3c5ba6a791b0	a78272dc-151f-400f-a0b4-1eeec317739c	t
b16a1337-629a-4722-a030-648a69d9cd9b	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	a78272dc-151f-400f-a0b4-1eeec317739c	t
e401752a-e98e-4bfa-a3f5-41647d4fd236	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	a78272dc-151f-400f-a0b4-1eeec317739c	t
ad2aab6e-801f-4353-818c-0caf92911ad9	45327728-ad89-43be-8445-87c2f73c84b8	a78272dc-151f-400f-a0b4-1eeec317739c	t
a5b202a4-2fa6-4fef-8ff1-ed295b2dff3a	f54f10cb-97ad-4234-a75f-c302f04f47c9	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
b146030f-5d2f-420c-8280-94c682212da9	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
8f14651f-b74b-4daf-9cda-fcbf462d6b4b	e00dec9b-4ee9-4f25-a125-03c806f3556c	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
72f32fbb-b155-48f0-843a-9f461e1547f5	eacbc2ec-1d49-4099-985d-b0879662b6e4	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
13cdfbca-61bf-43c0-a687-8b4291bc2034	a549e323-bd8e-4df3-9767-83b948c3fea0	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
f826d505-e28b-4e35-9e37-68136b74b8dc	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
50eabae3-14da-4ef0-ab18-c84221a8b154	df736872-f0e0-4fab-bd9b-bf6ec37c6738	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
aa0d1793-8bb2-411d-9c0f-afc043ccc726	f42b377d-c608-4523-b690-7f890c9918e0	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
ae5df6d1-ec24-4914-9965-3f37c7f3972b	d38185b6-6436-4e71-98bf-e46862dd84db	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
99dce56f-9d45-4937-b9f9-0712bf7a410b	84948d42-653c-4704-9685-83ceb9ef0292	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
4935a2bd-6731-4def-a001-640f83196c5f	d38f1cff-de34-48e0-9d7c-2d8687d6d335	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
91a54e7d-2ed1-4fce-9cb0-e09731b1edbf	d796a01a-9e5a-4184-a99f-791487ecc13f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
6131d500-0530-4b26-a670-6ce83f3afe95	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
ec70d0d6-eccc-4fa2-a963-58e2f6db1868	867977d1-ed38-4338-8e00-d51db1efa8d0	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
9e74475b-6c0e-45d6-a6ad-7cbc0ede15a4	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
bf6880b9-0b25-4312-96c6-50b55f01f5cc	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
775e11d5-0be1-4cbe-9ee3-8ee8bdea1218	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
ec8d62ea-8f8f-4c7b-a901-156d08995042	6fba7b48-d4e6-4870-bebc-f2cf758809b2	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
1bf65b30-2720-4a2f-b7ee-fd0e34fefe59	53977b1c-d564-4166-b113-338d5332fc48	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
32f1f5a5-fa64-474f-ba0d-902727fb86ff	5b5bfafc-1139-4003-9526-3c5ba6a791b0	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
e121525b-1e10-42d1-80b8-97af4a3b8303	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
7e3cb315-a575-4724-8237-e7a0a8801008	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
738f65e7-d052-45b6-b232-f1e12a122fe2	45327728-ad89-43be-8445-87c2f73c84b8	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
ef820933-8f77-464d-aba9-7124ac927bdf	f54f10cb-97ad-4234-a75f-c302f04f47c9	47d8c413-5440-4d05-90cb-0757217fdfaf	t
820a431d-b352-4fbf-9115-63e6df173465	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	47d8c413-5440-4d05-90cb-0757217fdfaf	f
9c6ac93d-b168-4543-8d87-634b901478c1	e00dec9b-4ee9-4f25-a125-03c806f3556c	47d8c413-5440-4d05-90cb-0757217fdfaf	f
29254562-91af-45ed-ac86-9f27a281efe9	eacbc2ec-1d49-4099-985d-b0879662b6e4	47d8c413-5440-4d05-90cb-0757217fdfaf	f
22efd1d6-efe0-4f92-8131-f4892bd958eb	a549e323-bd8e-4df3-9767-83b948c3fea0	47d8c413-5440-4d05-90cb-0757217fdfaf	f
8758a229-c78b-46c1-acc0-6881e3a09dcb	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	47d8c413-5440-4d05-90cb-0757217fdfaf	f
0f43206f-2f16-4dcb-870e-aac34865e011	df736872-f0e0-4fab-bd9b-bf6ec37c6738	47d8c413-5440-4d05-90cb-0757217fdfaf	f
5f85a961-0760-414d-9210-1f42e6679ad7	f42b377d-c608-4523-b690-7f890c9918e0	47d8c413-5440-4d05-90cb-0757217fdfaf	f
c3342800-eedd-465d-9169-e24d00933ff2	d38185b6-6436-4e71-98bf-e46862dd84db	47d8c413-5440-4d05-90cb-0757217fdfaf	t
18be48a7-25ec-4b86-83b8-9738d1c47b71	84948d42-653c-4704-9685-83ceb9ef0292	47d8c413-5440-4d05-90cb-0757217fdfaf	t
7521d00e-1961-4a17-9692-14bded3a482a	d38f1cff-de34-48e0-9d7c-2d8687d6d335	47d8c413-5440-4d05-90cb-0757217fdfaf	t
e3049785-1709-40e8-95ac-dc134028b9ac	d796a01a-9e5a-4184-a99f-791487ecc13f	47d8c413-5440-4d05-90cb-0757217fdfaf	t
c84b9823-0f13-44b3-9b8b-e32ffa937a92	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	47d8c413-5440-4d05-90cb-0757217fdfaf	t
d3e05ae7-400d-4229-9f08-9828e276c345	867977d1-ed38-4338-8e00-d51db1efa8d0	47d8c413-5440-4d05-90cb-0757217fdfaf	t
c44e6b23-73fa-442d-990a-18c567ae3476	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	47d8c413-5440-4d05-90cb-0757217fdfaf	t
91670d78-941b-4542-a9e6-70b3c0892e58	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	47d8c413-5440-4d05-90cb-0757217fdfaf	t
a46f1f54-6caa-4281-bd1f-ac813b3b6272	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	47d8c413-5440-4d05-90cb-0757217fdfaf	t
132ad5c5-a477-4d0c-8e6b-8ae40d81b85a	6fba7b48-d4e6-4870-bebc-f2cf758809b2	47d8c413-5440-4d05-90cb-0757217fdfaf	t
740b314f-7003-4e4f-8f59-48cd33753e0a	53977b1c-d564-4166-b113-338d5332fc48	47d8c413-5440-4d05-90cb-0757217fdfaf	t
6ab1a20f-075d-4b3c-956b-fa20a61e6f10	5b5bfafc-1139-4003-9526-3c5ba6a791b0	47d8c413-5440-4d05-90cb-0757217fdfaf	t
acf6b774-933e-4958-9993-86cc2f9d83a8	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	47d8c413-5440-4d05-90cb-0757217fdfaf	t
452f1203-260e-4b21-9a63-a41075e072a8	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	47d8c413-5440-4d05-90cb-0757217fdfaf	t
084fdaae-f06e-4e5c-b048-d2acc9918f6d	45327728-ad89-43be-8445-87c2f73c84b8	47d8c413-5440-4d05-90cb-0757217fdfaf	t
afff4094-7e5c-4081-a18c-147bd11ff5e1	f54f10cb-97ad-4234-a75f-c302f04f47c9	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
fccc9074-f2f4-4d06-9917-9e8415cbb80c	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
ad4739d2-7961-431d-b7a4-30c1ae8dbe63	e00dec9b-4ee9-4f25-a125-03c806f3556c	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
a520d9a4-787e-4d2e-9a64-14e8a8d9546f	eacbc2ec-1d49-4099-985d-b0879662b6e4	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
459af14d-5558-4368-9cd9-0ccefb4c61b6	a549e323-bd8e-4df3-9767-83b948c3fea0	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
0a58891c-aed5-417e-b647-365d1ef0467f	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
54e8bf9c-0f33-4709-8369-52b355c431ab	df736872-f0e0-4fab-bd9b-bf6ec37c6738	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
edffe7c5-7b7f-4533-9976-1305ae599601	f42b377d-c608-4523-b690-7f890c9918e0	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
255a27fc-4abf-4b89-8f60-ff163c2a26e6	d38185b6-6436-4e71-98bf-e46862dd84db	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
ee096742-861d-45dd-95a7-6a5ed8725e30	84948d42-653c-4704-9685-83ceb9ef0292	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
baf9c13a-94a4-4de1-98c1-6d14784d9915	d38f1cff-de34-48e0-9d7c-2d8687d6d335	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
0db6c1f4-597e-41c9-9d47-ff0679848943	d796a01a-9e5a-4184-a99f-791487ecc13f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
8a926d32-6aac-4fdd-8448-251c297c3180	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
d3ddae86-a3a7-4de3-af0b-e1c68866a65d	867977d1-ed38-4338-8e00-d51db1efa8d0	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
11279af7-b5e3-4fca-9e79-72d9940a17ae	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
ef860379-86a3-452c-8e52-aa8b63721edb	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
2b4ba438-00bb-4f7b-a27d-c389c09203b5	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
af053786-bc44-4ebd-8fd3-e1c887f010f6	6fba7b48-d4e6-4870-bebc-f2cf758809b2	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
71a514b8-9254-4b6e-a580-9bf55e2925d9	53977b1c-d564-4166-b113-338d5332fc48	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
bcbf3438-7904-415e-bdbc-327ee9a67732	5b5bfafc-1139-4003-9526-3c5ba6a791b0	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
16a940cf-16c7-4a10-9dc4-a83ea648b2d7	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
6c55b5a5-f480-431d-b9c3-005fb0d5ac80	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
59766690-5825-471d-9b28-e226b9054481	45327728-ad89-43be-8445-87c2f73c84b8	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
a3ec80da-a520-4f4b-b79c-1ff005768080	f54f10cb-97ad-4234-a75f-c302f04f47c9	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
538f0381-5ec4-472e-8877-1e94e0fb4bd3	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
2b5ad513-4444-41ff-bb5b-75c4ba265ad2	e00dec9b-4ee9-4f25-a125-03c806f3556c	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
fe5af0bd-df12-4e47-93b8-072d9bd7514d	eacbc2ec-1d49-4099-985d-b0879662b6e4	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
02e72a27-f761-435f-a4b6-912aadd4fda0	a549e323-bd8e-4df3-9767-83b948c3fea0	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
f70e49d7-ed40-4d00-9e19-a1fd8ecb52e8	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
c9392f00-8bb8-4e02-a32c-eddff67c70e7	df736872-f0e0-4fab-bd9b-bf6ec37c6738	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
1af3dfd7-c19f-49f3-ab6f-b125e676bbc8	f42b377d-c608-4523-b690-7f890c9918e0	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
1ead2b8e-bdc6-4226-abb3-e770b7cf3085	d38185b6-6436-4e71-98bf-e46862dd84db	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
1319e657-11eb-4708-b1e0-cc70cb5774eb	84948d42-653c-4704-9685-83ceb9ef0292	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
c0011e1f-a2a9-49b2-b2c3-0b1e905dc68e	d38f1cff-de34-48e0-9d7c-2d8687d6d335	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
004e8cd8-4cbc-4db8-b259-0247c83894f0	d796a01a-9e5a-4184-a99f-791487ecc13f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
7f014875-8836-46a6-97f5-b0a012a1f9b6	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
de0cd9ca-0245-4442-88c7-47496626a2ad	867977d1-ed38-4338-8e00-d51db1efa8d0	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
b5980c9b-0e48-4021-8332-a827cc05169f	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
d2a3ff28-c9cc-4424-8861-1ba8c1d497cb	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
942a46c3-b54a-43ba-9f60-095122d0bf2d	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
c20417fc-9835-44ae-b4a9-8eb5b0cbac8e	6fba7b48-d4e6-4870-bebc-f2cf758809b2	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
bb41e081-3797-4e76-96a6-4821e82e69e6	53977b1c-d564-4166-b113-338d5332fc48	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
50387c10-ff1d-4393-aa88-8d7914479923	5b5bfafc-1139-4003-9526-3c5ba6a791b0	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
e5348451-1349-4dc3-9b60-10b6faea6050	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
77da9c73-c526-4138-bb70-c296d0905920	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	d1dce1c9-e82b-4efb-8d22-00117a37b94a	f
b644067d-0b2d-4d01-b931-326f6ec46ea6	45327728-ad89-43be-8445-87c2f73c84b8	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
8efe717a-18c8-4f7e-b97a-4c3c61b196ae	f54f10cb-97ad-4234-a75f-c302f04f47c9	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
f16990d6-127f-46fa-bcc9-caa8cd1b9efb	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
922dd6fc-0a8d-4c45-8630-6ba8bf0187c0	e00dec9b-4ee9-4f25-a125-03c806f3556c	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
01ac98e8-85ad-4a83-a319-983ba511df94	eacbc2ec-1d49-4099-985d-b0879662b6e4	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
84ba83bc-c6a2-4a1e-b4df-b131d22f86b5	a549e323-bd8e-4df3-9767-83b948c3fea0	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
7b7ec7d0-cb71-45cb-bae1-89d7c8dfb9fa	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
46849478-fcb6-49dd-9774-0e2b3112e191	df736872-f0e0-4fab-bd9b-bf6ec37c6738	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
0ba37245-3c05-4d13-9b48-5330642e1911	f42b377d-c608-4523-b690-7f890c9918e0	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
784378c2-9000-414d-9db6-71df706faf59	d38185b6-6436-4e71-98bf-e46862dd84db	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
085b9348-419f-4727-a867-d66f942bcf5f	84948d42-653c-4704-9685-83ceb9ef0292	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
e57ea8a9-1b4e-4117-ad22-c30f028b8fe6	d38f1cff-de34-48e0-9d7c-2d8687d6d335	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
1e0eda14-7330-4099-907a-837b258965d7	d796a01a-9e5a-4184-a99f-791487ecc13f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
6fe22acf-00e3-4635-8c1f-75d9b6394131	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
200288c5-c667-4b27-962b-4ecb037572d7	867977d1-ed38-4338-8e00-d51db1efa8d0	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
8005633a-b92c-4f29-829e-79581cdfb7ee	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
8a1e6e20-39e4-4b95-b1c7-6fff59a7ef23	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
a4669d01-94f0-4c25-b976-b223af7f5f21	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
7d8a2d59-f429-4c12-9a16-1735373afc0a	6fba7b48-d4e6-4870-bebc-f2cf758809b2	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
0567cf7a-4b16-4605-8bb4-ec582fd75a2f	53977b1c-d564-4166-b113-338d5332fc48	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
11c70caf-9a14-4a1c-bf49-5865125d8236	5b5bfafc-1139-4003-9526-3c5ba6a791b0	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
8f290ec5-ccd0-4eef-9726-25c5c3e1abdc	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
93f2129f-899d-4625-a359-b2b64b5bf947	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	f
f9264c9d-433f-41d6-8f7e-edd505776fa9	45327728-ad89-43be-8445-87c2f73c84b8	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
e1418415-9ca7-4508-8efa-390d7e717b48	f54f10cb-97ad-4234-a75f-c302f04f47c9	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
c5994d20-7586-4d7f-9ada-9517c508f64a	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
623b3b2f-445e-41fc-9a46-5dabef1ffa36	e00dec9b-4ee9-4f25-a125-03c806f3556c	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
58fe8bc3-6d43-4432-b424-e112be20cca0	eacbc2ec-1d49-4099-985d-b0879662b6e4	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
21202741-502d-466e-ab2d-a6cfaf41ea9d	a549e323-bd8e-4df3-9767-83b948c3fea0	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
3a7da2d3-863c-4f93-90df-f0b37f5b7ba6	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
d0f2a928-7b51-4d7f-812d-49e868d13c13	df736872-f0e0-4fab-bd9b-bf6ec37c6738	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
af78e2dd-e646-4fde-8433-fca28cc1f2b2	f42b377d-c608-4523-b690-7f890c9918e0	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
4a033df1-8372-40aa-9064-d80df98c0706	d38185b6-6436-4e71-98bf-e46862dd84db	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
2b76135a-260e-48d6-88fd-7d0dce117e06	84948d42-653c-4704-9685-83ceb9ef0292	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
c2bedad9-dd86-47ef-9633-0cc9c7aa4825	d38f1cff-de34-48e0-9d7c-2d8687d6d335	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
2c9a879d-debf-4b75-8afd-0efd945a5361	d796a01a-9e5a-4184-a99f-791487ecc13f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
6fdb4f02-fd0b-46ef-8e4e-d337dceb62d1	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
cd779770-794d-4bc1-86be-d364e63412b7	867977d1-ed38-4338-8e00-d51db1efa8d0	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
c862de75-1f04-4b8f-b3e7-452d6a1b7557	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
9e33a206-db06-4ba9-8c85-0cd4d3568107	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
dad1b779-e3ce-4e1a-9d55-5c4aea02d8c8	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
fb99c529-a673-4dac-b32d-47f782de7b9c	6fba7b48-d4e6-4870-bebc-f2cf758809b2	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
0d8bc170-78c5-4b0e-ac1e-a67ce287b289	53977b1c-d564-4166-b113-338d5332fc48	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
227aa00e-8ad5-438f-9846-8ed873324dd4	5b5bfafc-1139-4003-9526-3c5ba6a791b0	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
0128b77c-ad0c-4aff-a3b4-9a0e48556eb3	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
32136e3b-5975-4f1f-ac71-5132448fab94	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
32844983-bb23-46da-a3a2-96e431960e7a	45327728-ad89-43be-8445-87c2f73c84b8	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
f5cb2243-2680-4ec6-a5c1-ff218e5434fa	f54f10cb-97ad-4234-a75f-c302f04f47c9	e79979e1-326f-4b84-b613-ce32953d1f05	t
0d041622-534f-4b79-9761-2613937ed105	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	e79979e1-326f-4b84-b613-ce32953d1f05	t
e2b148a5-5036-4d1d-8871-9ef4ba354c13	e00dec9b-4ee9-4f25-a125-03c806f3556c	e79979e1-326f-4b84-b613-ce32953d1f05	t
5382d6ec-eb3a-4239-b1df-d6445b62d376	eacbc2ec-1d49-4099-985d-b0879662b6e4	e79979e1-326f-4b84-b613-ce32953d1f05	t
7ed3994b-366d-4b83-8fc1-4fc6bf61c2d0	a549e323-bd8e-4df3-9767-83b948c3fea0	e79979e1-326f-4b84-b613-ce32953d1f05	t
d685116a-323e-4021-86dc-966173ad94c0	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	e79979e1-326f-4b84-b613-ce32953d1f05	t
2a38cfa0-e1c1-49c7-9316-5fb59d3be503	df736872-f0e0-4fab-bd9b-bf6ec37c6738	e79979e1-326f-4b84-b613-ce32953d1f05	t
fff400c7-ed55-430b-a986-6471d09b3252	f42b377d-c608-4523-b690-7f890c9918e0	e79979e1-326f-4b84-b613-ce32953d1f05	t
229c59ef-4e0a-41b1-a21d-4abd46b578ee	d38185b6-6436-4e71-98bf-e46862dd84db	e79979e1-326f-4b84-b613-ce32953d1f05	t
19b9d22b-9b04-4658-82ba-9c6746a5fb49	84948d42-653c-4704-9685-83ceb9ef0292	e79979e1-326f-4b84-b613-ce32953d1f05	t
c74654a5-0b81-4a20-b2d0-05b0c5645fa2	d38f1cff-de34-48e0-9d7c-2d8687d6d335	e79979e1-326f-4b84-b613-ce32953d1f05	t
69d88c1c-1873-488a-8523-46f570563d68	d796a01a-9e5a-4184-a99f-791487ecc13f	e79979e1-326f-4b84-b613-ce32953d1f05	t
18408c1e-010b-4eaf-9bc7-6a7a006bb94c	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	e79979e1-326f-4b84-b613-ce32953d1f05	t
1bae2b06-fe25-4ab4-8781-e00342681bd0	867977d1-ed38-4338-8e00-d51db1efa8d0	e79979e1-326f-4b84-b613-ce32953d1f05	t
941d5753-f7d5-4e43-bc34-25096f946828	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	e79979e1-326f-4b84-b613-ce32953d1f05	t
1f55e7d7-78de-4401-9668-773ffac75f0a	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	e79979e1-326f-4b84-b613-ce32953d1f05	t
82e3ff80-e522-4acc-a39b-203e996cad22	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	e79979e1-326f-4b84-b613-ce32953d1f05	t
9535b8ab-54ed-4e18-9a55-76248ab3c296	6fba7b48-d4e6-4870-bebc-f2cf758809b2	e79979e1-326f-4b84-b613-ce32953d1f05	t
37fc0f6b-eb4b-447f-bfe2-6b6cfeba72fc	53977b1c-d564-4166-b113-338d5332fc48	e79979e1-326f-4b84-b613-ce32953d1f05	t
45aaec76-0202-4780-94b5-8fb9c9811a2d	5b5bfafc-1139-4003-9526-3c5ba6a791b0	e79979e1-326f-4b84-b613-ce32953d1f05	t
546e0f14-17b6-4f32-84be-d91744a2465f	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	e79979e1-326f-4b84-b613-ce32953d1f05	t
b82679e3-e488-40d2-b385-6e3ec3afa761	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	e79979e1-326f-4b84-b613-ce32953d1f05	t
6a7b9060-b72a-4524-9536-5e39f873b9c2	45327728-ad89-43be-8445-87c2f73c84b8	e79979e1-326f-4b84-b613-ce32953d1f05	t
a7b3b630-e9c8-4acf-9351-abf87aa7714b	f54f10cb-97ad-4234-a75f-c302f04f47c9	11c8fe77-61a2-4761-b804-46106525f467	t
30979591-22ad-4c4b-8f23-7642d091011e	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	11c8fe77-61a2-4761-b804-46106525f467	t
83555a95-4c44-45a7-a970-d880955da54e	e00dec9b-4ee9-4f25-a125-03c806f3556c	11c8fe77-61a2-4761-b804-46106525f467	t
455fc00c-d396-4e2e-a8c6-ade5330d0da8	eacbc2ec-1d49-4099-985d-b0879662b6e4	11c8fe77-61a2-4761-b804-46106525f467	t
c70f1833-8b6e-4b94-b4d7-3ecadaf3f37b	a549e323-bd8e-4df3-9767-83b948c3fea0	11c8fe77-61a2-4761-b804-46106525f467	t
183d6c5f-4620-4f7f-a26d-fbaa20e59d48	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	11c8fe77-61a2-4761-b804-46106525f467	t
1daa8bed-b21b-4409-abcb-32ac56a2614e	df736872-f0e0-4fab-bd9b-bf6ec37c6738	11c8fe77-61a2-4761-b804-46106525f467	t
1210c3a1-9caf-4022-a51e-67abfe471837	f42b377d-c608-4523-b690-7f890c9918e0	11c8fe77-61a2-4761-b804-46106525f467	t
6eb99717-9d8e-4267-8572-e29985a2f22e	d38185b6-6436-4e71-98bf-e46862dd84db	11c8fe77-61a2-4761-b804-46106525f467	t
56a6e26a-3e51-4ec2-bcf9-6745ddf657e2	84948d42-653c-4704-9685-83ceb9ef0292	11c8fe77-61a2-4761-b804-46106525f467	t
7e1571fd-5892-4547-9613-152d7ae95ff6	d38f1cff-de34-48e0-9d7c-2d8687d6d335	11c8fe77-61a2-4761-b804-46106525f467	t
0d4a4958-ccaf-40f8-8428-a6ebe2159488	d796a01a-9e5a-4184-a99f-791487ecc13f	11c8fe77-61a2-4761-b804-46106525f467	t
a167108b-f0ab-442d-acf6-13be7d679428	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	11c8fe77-61a2-4761-b804-46106525f467	t
8ac21ad1-bb41-452d-9a5c-80e6106285a4	867977d1-ed38-4338-8e00-d51db1efa8d0	11c8fe77-61a2-4761-b804-46106525f467	t
827b45c3-727b-49a8-9c6e-6fcc1e2db835	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	11c8fe77-61a2-4761-b804-46106525f467	t
39353f0e-2866-4394-b05e-398df16d027b	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	11c8fe77-61a2-4761-b804-46106525f467	t
6320f54a-8c0d-4588-bc9e-19a6ea2a7ac7	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	11c8fe77-61a2-4761-b804-46106525f467	t
01b21f93-599f-4481-b229-acabe31e9481	6fba7b48-d4e6-4870-bebc-f2cf758809b2	11c8fe77-61a2-4761-b804-46106525f467	t
6b934def-49bd-400a-a772-2225db51d144	53977b1c-d564-4166-b113-338d5332fc48	11c8fe77-61a2-4761-b804-46106525f467	t
dceabe15-55ef-42d1-a34b-2c47b31905a1	5b5bfafc-1139-4003-9526-3c5ba6a791b0	11c8fe77-61a2-4761-b804-46106525f467	t
e9655e36-ccad-4556-a76f-a9909a45570c	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	11c8fe77-61a2-4761-b804-46106525f467	t
b044145c-b528-4ca8-a7af-92fdf196cf2a	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	11c8fe77-61a2-4761-b804-46106525f467	f
01696722-a948-4ca1-a745-52d97d41d928	45327728-ad89-43be-8445-87c2f73c84b8	11c8fe77-61a2-4761-b804-46106525f467	t
7c201283-8851-40c9-90cb-c3465ff6c53e	f54f10cb-97ad-4234-a75f-c302f04f47c9	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
aa811b46-3014-45aa-9935-49bdd25408fc	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
e31856bc-4283-4a41-89e8-02882954f1a4	e00dec9b-4ee9-4f25-a125-03c806f3556c	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
49574926-c887-4111-95be-6c0f6bb7e513	eacbc2ec-1d49-4099-985d-b0879662b6e4	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
b04641a3-b2ef-498e-9d2d-5a5cc5603294	a549e323-bd8e-4df3-9767-83b948c3fea0	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
9604a4ac-bb45-4d63-815b-ab5e735a87c7	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
abdde23a-6f7a-4d81-b70c-95fb66ab7228	df736872-f0e0-4fab-bd9b-bf6ec37c6738	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
90e4cfb0-7ea1-4df0-b3e4-e9f5cc14929f	f42b377d-c608-4523-b690-7f890c9918e0	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
4281d84a-3391-45b5-8f57-27c1001b71ee	d38185b6-6436-4e71-98bf-e46862dd84db	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
f73cfc63-e190-4927-9bd8-63182a85d61d	84948d42-653c-4704-9685-83ceb9ef0292	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
0e5afbc9-bdc6-4d21-b516-7e0a82dfd453	d38f1cff-de34-48e0-9d7c-2d8687d6d335	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
eaeeca1c-5fb1-490c-8b67-cfd8add7918b	d796a01a-9e5a-4184-a99f-791487ecc13f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
9d738038-064f-46cc-b325-c366d02bb14e	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
2749b68b-ba24-43e9-b946-a8b9e301830a	867977d1-ed38-4338-8e00-d51db1efa8d0	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
eb3d72fc-1471-4d83-a834-8aee8c603f04	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
317337eb-1960-42e0-9c32-95f0f60df0cc	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
4e8953b1-9eae-4f10-ab0b-f939488148c2	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
1164f191-8570-4d1c-abe6-35c6ac9aab67	6fba7b48-d4e6-4870-bebc-f2cf758809b2	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
38cf36b4-4720-48bc-ade5-a127ab0b330b	53977b1c-d564-4166-b113-338d5332fc48	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
2b8aee67-f69d-4096-b1a3-67379b2a4790	5b5bfafc-1139-4003-9526-3c5ba6a791b0	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
e66ee951-1978-48b6-8d03-a4fc084ba93c	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
6a0f16ff-ed53-42c6-b9ae-22950d6624d7	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
96d5c430-dbe7-4dbd-8d3e-3504b1599422	45327728-ad89-43be-8445-87c2f73c84b8	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
95667083-a171-439a-8aea-7dc34779494d	f54f10cb-97ad-4234-a75f-c302f04f47c9	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
eee1f6d1-6f41-48e1-9602-86fbb5f6be22	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
1508a7d2-f00a-4017-83c4-5682320dfd1a	e00dec9b-4ee9-4f25-a125-03c806f3556c	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
2d05cc02-6a89-4db9-a426-a0fe568be797	eacbc2ec-1d49-4099-985d-b0879662b6e4	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
5b1ea15c-26d3-44ae-837c-83174c37693e	a549e323-bd8e-4df3-9767-83b948c3fea0	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
c1e13a90-fdc9-465d-91c8-2be75d0a692b	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
2308756c-c7f7-412b-bac0-8118a9defbb1	df736872-f0e0-4fab-bd9b-bf6ec37c6738	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
b769d3db-a012-4a2b-b939-9c9d1c933a5a	f42b377d-c608-4523-b690-7f890c9918e0	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
da7630b8-6c64-4807-8ca9-ec4fcc3be6a9	d38185b6-6436-4e71-98bf-e46862dd84db	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
681bf5bc-1951-488a-8b53-0a1751635cad	84948d42-653c-4704-9685-83ceb9ef0292	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
00304268-5f45-4ea7-8e76-8b41315504d4	d38f1cff-de34-48e0-9d7c-2d8687d6d335	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
6b5af501-e469-43df-8d77-0f314e64e626	d796a01a-9e5a-4184-a99f-791487ecc13f	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
1aa04330-12ab-4c28-a12b-787866b72811	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
1e03f45e-2fd0-44d1-977c-3c774a91c231	867977d1-ed38-4338-8e00-d51db1efa8d0	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
28ed1773-696b-46bd-853f-f73c23dcfd93	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
03df1018-354a-495d-928f-5ecc9c43992b	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
11da0667-b44e-4ca9-988d-435d848cd969	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
6895431f-bbab-4d4b-9c34-76e9e9de524f	6fba7b48-d4e6-4870-bebc-f2cf758809b2	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
0fc8f013-3c7a-4165-9272-618bdb940164	53977b1c-d564-4166-b113-338d5332fc48	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
9dccf523-d76c-43d3-aac5-0dafc8629b6f	5b5bfafc-1139-4003-9526-3c5ba6a791b0	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
b55bd39e-aac5-4aad-b9b2-0e7f985acdd5	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
9ddd12ae-af67-412b-a60f-40c032ebc561	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
4cb852a8-a190-46d9-aa96-7baf9d73635b	45327728-ad89-43be-8445-87c2f73c84b8	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
f6feb267-a6e7-43a6-9ef0-3d70fca29d16	f54f10cb-97ad-4234-a75f-c302f04f47c9	c827a01f-387c-4c59-bfcd-829297a30a74	t
21ca7897-0aa4-431e-98e7-602fd78719fb	9f3fe0dd-ca5e-441e-9c88-046840e98fe6	c827a01f-387c-4c59-bfcd-829297a30a74	f
ef0a7ff8-925a-4b90-810f-62249f590270	e00dec9b-4ee9-4f25-a125-03c806f3556c	c827a01f-387c-4c59-bfcd-829297a30a74	f
5cbeb070-0559-416f-a9b8-4d6cf34831ee	eacbc2ec-1d49-4099-985d-b0879662b6e4	c827a01f-387c-4c59-bfcd-829297a30a74	f
ba771aa6-0439-4bb3-9396-15964dee1c44	a549e323-bd8e-4df3-9767-83b948c3fea0	c827a01f-387c-4c59-bfcd-829297a30a74	f
b06b29e8-e04b-4039-a391-d9f73daf66cc	0007ed4f-52d4-48d6-8987-fd7da37cc8ea	c827a01f-387c-4c59-bfcd-829297a30a74	f
861125e6-3402-4a17-b293-7f3944c07a36	df736872-f0e0-4fab-bd9b-bf6ec37c6738	c827a01f-387c-4c59-bfcd-829297a30a74	f
5f21ae79-9c2f-4bde-84af-f3640ceb74dd	f42b377d-c608-4523-b690-7f890c9918e0	c827a01f-387c-4c59-bfcd-829297a30a74	f
0d973458-b7e0-4423-99fe-cd228ae56185	d38185b6-6436-4e71-98bf-e46862dd84db	c827a01f-387c-4c59-bfcd-829297a30a74	t
196a0371-d30f-40d9-a7b1-3d41c879993b	84948d42-653c-4704-9685-83ceb9ef0292	c827a01f-387c-4c59-bfcd-829297a30a74	t
8a067284-ad0e-4715-bf23-472e04edadfc	d38f1cff-de34-48e0-9d7c-2d8687d6d335	c827a01f-387c-4c59-bfcd-829297a30a74	t
768ffc78-fff2-4c24-ac9a-aa03b5e1b299	d796a01a-9e5a-4184-a99f-791487ecc13f	c827a01f-387c-4c59-bfcd-829297a30a74	t
57edada0-ba1e-41b1-b6ad-8d3e1b5c95dd	ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	c827a01f-387c-4c59-bfcd-829297a30a74	t
1a807a4c-b50c-44ab-a35d-dd9737e53d9b	867977d1-ed38-4338-8e00-d51db1efa8d0	c827a01f-387c-4c59-bfcd-829297a30a74	t
11742eef-96f2-4227-9fc9-7afaaf51a78e	624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	c827a01f-387c-4c59-bfcd-829297a30a74	t
1d4e0b60-1994-4e1a-81f2-3d347b2c1fbd	746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	c827a01f-387c-4c59-bfcd-829297a30a74	t
7d4618a6-fda4-499e-af89-f26c2b228901	a4df1bb6-2eb2-400f-8cc2-739f6833f98d	c827a01f-387c-4c59-bfcd-829297a30a74	t
0a76a1a3-944c-4be5-9949-abcd2cfae654	6fba7b48-d4e6-4870-bebc-f2cf758809b2	c827a01f-387c-4c59-bfcd-829297a30a74	t
af13a233-1400-4f27-a769-4ce4e3edfe9d	53977b1c-d564-4166-b113-338d5332fc48	c827a01f-387c-4c59-bfcd-829297a30a74	t
963f60cc-4a2c-4330-a4c5-35842e5ae905	5b5bfafc-1139-4003-9526-3c5ba6a791b0	c827a01f-387c-4c59-bfcd-829297a30a74	t
ec440fff-a537-4ff8-9902-0cbfd64d0dab	77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	c827a01f-387c-4c59-bfcd-829297a30a74	t
1b5193fa-2b9b-42cc-b937-16f29d6723bd	f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	c827a01f-387c-4c59-bfcd-829297a30a74	t
6113cd87-1da1-45bd-8bb9-e7d9f26f9b3d	45327728-ad89-43be-8445-87c2f73c84b8	c827a01f-387c-4c59-bfcd-829297a30a74	t
6b1d841a-a850-4a5a-b272-72cb1b3df0bf	2896a379-554f-49a0-9969-a0c755ce4991	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
1fa8a9ff-c120-4b65-80a2-761e72e3fc64	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
77c5090e-b582-4467-8c32-3e3868fd0516	13846310-0456-481d-8791-66eac9f53c8f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
f794e011-3e67-4810-8d98-f12c1e82a73f	aed3be59-7096-4d93-ba73-375f068ac05a	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
7403336a-b42a-47b4-af52-22dd4a98d2d9	fce4b9ae-c28f-43bb-ba90-abf2010a693b	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
bbadbe03-c346-4206-84e5-7844c2616a46	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
a4b4cf62-2d03-4c92-bbe5-2f43c38d2ad5	4db35518-a75a-427b-9f28-ada15be0f391	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
d4e116f7-5914-4334-9d2d-5676d8ee450a	13c6c895-d834-42eb-8865-decc01d94e42	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
e337fe64-61fb-4520-9675-78984cf337e0	0af7012d-d1e2-447e-8903-19e4becd0d63	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
9523bc11-633d-4b17-aad4-4554faee1263	922f4bf3-4a24-49c1-ad57-b74a05a253ab	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
96d08304-a3e3-4071-aac7-374ba56b3f66	6ac214f6-41cb-4be6-9765-df33bad3b63f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
52e49272-3c28-42e7-ae45-958607c88f87	bc914e7f-4401-4448-aca9-9c058ae999b3	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
527360bc-ab1b-4ee9-8e31-2c8741980a3c	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
ab39f45f-4736-470a-933e-74ec10fb2a79	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
e3d8f022-71e7-4bb3-bbaf-e7e9a2210c61	c0fbd9f3-9271-433c-9075-d96b25eba0e9	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
26ed9097-9522-4c09-ba81-4fa492ef8e85	ea9057ff-1aa1-4565-b084-f743a4a3d975	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
fa8fb869-a278-45b2-abfc-4cf0e8492834	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
4107f25c-91b1-4d4f-a09f-98da4cb027f6	68c06cf9-d8e9-463d-93f7-360c8daa7683	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
d84f79ca-f7c2-4451-9922-cd16a1bf7de5	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
7b222e50-5b52-46d6-acba-3c02fe5ef7d8	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
b0fba4b4-4ec4-4a42-987c-460456ef2292	ffe05eb5-ab28-467b-9e6a-e2a88887876b	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
ec0d1b9d-8ad4-407b-8a21-86450fbf1412	cc6392ae-9095-409a-a453-b95fcfcc16f1	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
9f44f5f5-cbf5-4075-b442-c7f16fd91038	999a870f-4b2a-4161-82d9-ba58c7a77fd2	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
3fcfc704-b86c-4fe2-8dbe-e7e7e0c25439	6d204d7f-e985-4328-90ea-cebf86b9271b	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
632a005a-2584-4d25-b7cb-56075765f969	2896a379-554f-49a0-9969-a0c755ce4991	ab8d6a3a-8889-442c-996e-15825a25e37f	f
4d54e933-1688-443a-bfd0-fafeeb82fbf1	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	ab8d6a3a-8889-442c-996e-15825a25e37f	t
e6ce119d-fcff-4acb-ba79-851dfaddd39e	13846310-0456-481d-8791-66eac9f53c8f	ab8d6a3a-8889-442c-996e-15825a25e37f	t
aea93f9b-a073-47fd-9e8d-0f37acc4e640	aed3be59-7096-4d93-ba73-375f068ac05a	ab8d6a3a-8889-442c-996e-15825a25e37f	f
368e4208-929d-48d8-b061-360f5d843085	fce4b9ae-c28f-43bb-ba90-abf2010a693b	ab8d6a3a-8889-442c-996e-15825a25e37f	t
6d0c2d3e-fd76-4852-a857-576b1dd8c12f	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	ab8d6a3a-8889-442c-996e-15825a25e37f	t
7f885982-a69a-4856-8c18-19575d1b9388	4db35518-a75a-427b-9f28-ada15be0f391	ab8d6a3a-8889-442c-996e-15825a25e37f	t
e9be1f0a-a602-4b03-8a23-31224ff8d7df	13c6c895-d834-42eb-8865-decc01d94e42	ab8d6a3a-8889-442c-996e-15825a25e37f	t
018c227c-613e-4295-8e2b-712a08aa2ecc	0af7012d-d1e2-447e-8903-19e4becd0d63	ab8d6a3a-8889-442c-996e-15825a25e37f	t
017b270c-ae2a-4f9c-961d-379152b886e6	922f4bf3-4a24-49c1-ad57-b74a05a253ab	ab8d6a3a-8889-442c-996e-15825a25e37f	t
c7393372-43d9-4258-8651-689b0dabff4f	6ac214f6-41cb-4be6-9765-df33bad3b63f	ab8d6a3a-8889-442c-996e-15825a25e37f	t
dccc8b4a-ca1f-43b0-baec-8559be9e8539	bc914e7f-4401-4448-aca9-9c058ae999b3	ab8d6a3a-8889-442c-996e-15825a25e37f	t
90542f92-6cc3-4248-ab78-6e5bc6463dbc	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	ab8d6a3a-8889-442c-996e-15825a25e37f	t
20b37b10-ac2c-462f-a839-945c9db71d11	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	ab8d6a3a-8889-442c-996e-15825a25e37f	t
4df7a34c-8b0c-44e7-b3e7-073999582fd6	c0fbd9f3-9271-433c-9075-d96b25eba0e9	ab8d6a3a-8889-442c-996e-15825a25e37f	t
e9f7565c-1aad-4657-bde0-4514bfe0f9b9	ea9057ff-1aa1-4565-b084-f743a4a3d975	ab8d6a3a-8889-442c-996e-15825a25e37f	t
4964e66d-c88d-4019-bc67-96998372a63a	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	ab8d6a3a-8889-442c-996e-15825a25e37f	t
dfb57cf5-bc2a-4507-baff-528d2c4048b7	68c06cf9-d8e9-463d-93f7-360c8daa7683	ab8d6a3a-8889-442c-996e-15825a25e37f	t
e6e175c1-6484-4b29-b601-05de3994cc65	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	ab8d6a3a-8889-442c-996e-15825a25e37f	t
f51e39fd-eeef-464e-9ba2-8c94b1df053e	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	ab8d6a3a-8889-442c-996e-15825a25e37f	f
69d4f71f-0f32-4435-956d-62fe31a0ce51	ffe05eb5-ab28-467b-9e6a-e2a88887876b	ab8d6a3a-8889-442c-996e-15825a25e37f	t
f02e9137-1f58-4d5b-947b-82b41a8658a6	cc6392ae-9095-409a-a453-b95fcfcc16f1	ab8d6a3a-8889-442c-996e-15825a25e37f	t
6d45b8bc-b6d2-4084-8f5c-644ad0e085fd	999a870f-4b2a-4161-82d9-ba58c7a77fd2	ab8d6a3a-8889-442c-996e-15825a25e37f	t
f2918eae-33f3-4c04-8717-fce84b635594	6d204d7f-e985-4328-90ea-cebf86b9271b	ab8d6a3a-8889-442c-996e-15825a25e37f	t
402b7aa5-20e3-47ea-8d30-29f1f33f1ce7	2896a379-554f-49a0-9969-a0c755ce4991	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
1fbcff22-86a2-47dd-a537-ed2c0b5d7f78	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
40760dd4-8130-4fd8-92c9-cb610dbf8e66	13846310-0456-481d-8791-66eac9f53c8f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
74503219-dca9-46fc-bb1f-3259014d22e8	aed3be59-7096-4d93-ba73-375f068ac05a	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
64453dd7-259f-4399-817f-6aa08ccb6bc9	fce4b9ae-c28f-43bb-ba90-abf2010a693b	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
291ec2be-5054-4fb6-86c0-0afaae646e51	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
9a6c3299-164c-43e8-b2d1-c1bce41e2eaf	4db35518-a75a-427b-9f28-ada15be0f391	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
5149e8e4-2e0f-4797-a4ea-ca8e7ef36d78	13c6c895-d834-42eb-8865-decc01d94e42	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
053e40dc-d36a-4211-a898-03c87733a184	0af7012d-d1e2-447e-8903-19e4becd0d63	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
516bd824-196f-4589-8e00-6847eb4bdfe9	922f4bf3-4a24-49c1-ad57-b74a05a253ab	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
e26af6ff-6b55-4450-a39d-cb0ec647b597	6ac214f6-41cb-4be6-9765-df33bad3b63f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
fe47beee-da16-4262-8039-e634892a511c	bc914e7f-4401-4448-aca9-9c058ae999b3	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
a85b7f05-7bc2-477b-a02a-93af69bdd6b2	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
12cf3781-da39-4c3d-9225-0c56732a9121	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
b285a6b9-ab7c-478a-b31a-0cb367c51e4a	c0fbd9f3-9271-433c-9075-d96b25eba0e9	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
4cc20cce-6b40-4cf8-8dbd-197fe8543ef7	ea9057ff-1aa1-4565-b084-f743a4a3d975	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
8ecc28df-61d8-485c-81ff-051bb2f7ec5f	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
dccf9f9f-66e0-41bb-8f12-8372dd0cd71f	68c06cf9-d8e9-463d-93f7-360c8daa7683	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
73d1edb1-946b-425e-a2b1-e4d8a9b9ac33	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
944a6269-b046-4a09-91c9-dbdd18201171	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
c5824108-e4d8-49a8-aa73-eee201c2eee2	ffe05eb5-ab28-467b-9e6a-e2a88887876b	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
a2404669-ba5c-469b-8551-20264db51e74	cc6392ae-9095-409a-a453-b95fcfcc16f1	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
1e32278e-91a0-4d72-b84e-0824c9d7e027	999a870f-4b2a-4161-82d9-ba58c7a77fd2	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
d19edd94-e448-46cd-9563-4f4294c46d83	6d204d7f-e985-4328-90ea-cebf86b9271b	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
bbb1f62a-ae8c-473b-a910-2bbb49af3790	2896a379-554f-49a0-9969-a0c755ce4991	ae753320-c362-4d8b-8294-53533a1a5798	f
dde88391-074c-4b30-9861-81ecda69bfbb	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	ae753320-c362-4d8b-8294-53533a1a5798	t
fd11fc5f-4196-4528-8ee1-407085b414aa	13846310-0456-481d-8791-66eac9f53c8f	ae753320-c362-4d8b-8294-53533a1a5798	t
0450dd58-924c-492c-99d8-b21f341f41fb	aed3be59-7096-4d93-ba73-375f068ac05a	ae753320-c362-4d8b-8294-53533a1a5798	t
4df95ec5-93d8-44fa-967f-9377bcc3bf94	fce4b9ae-c28f-43bb-ba90-abf2010a693b	ae753320-c362-4d8b-8294-53533a1a5798	t
960adab4-646b-48e2-a900-a22820762304	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	ae753320-c362-4d8b-8294-53533a1a5798	t
3494ae41-f7e7-40f0-8ee7-aa8c15d78822	4db35518-a75a-427b-9f28-ada15be0f391	ae753320-c362-4d8b-8294-53533a1a5798	t
69d1e667-8738-409e-ba28-f59c7575fb4c	13c6c895-d834-42eb-8865-decc01d94e42	ae753320-c362-4d8b-8294-53533a1a5798	t
c8f1d7a2-024d-406f-ad19-b07e1e372a8c	0af7012d-d1e2-447e-8903-19e4becd0d63	ae753320-c362-4d8b-8294-53533a1a5798	t
5b98ce07-717c-4700-afdf-dbd554f6f478	922f4bf3-4a24-49c1-ad57-b74a05a253ab	ae753320-c362-4d8b-8294-53533a1a5798	t
5684951a-f4ee-41c8-9637-436a3df87e1e	6ac214f6-41cb-4be6-9765-df33bad3b63f	ae753320-c362-4d8b-8294-53533a1a5798	t
24d2f146-3a7d-47a9-9777-61c32e335c19	bc914e7f-4401-4448-aca9-9c058ae999b3	ae753320-c362-4d8b-8294-53533a1a5798	f
ae419e45-4981-4abf-a359-3ab48e744c0f	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	ae753320-c362-4d8b-8294-53533a1a5798	t
a3a9c811-dd56-4ee1-ab76-685e5e07f6e2	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	ae753320-c362-4d8b-8294-53533a1a5798	t
4a2ed017-4303-438b-8278-04c94d591e71	c0fbd9f3-9271-433c-9075-d96b25eba0e9	ae753320-c362-4d8b-8294-53533a1a5798	t
2b8cbeb3-d671-478d-a09d-31363f5f193b	ea9057ff-1aa1-4565-b084-f743a4a3d975	ae753320-c362-4d8b-8294-53533a1a5798	f
c11ca390-6963-431a-b4fa-41a6ea3249b2	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	ae753320-c362-4d8b-8294-53533a1a5798	t
55098115-e422-4100-90a0-bcbd6ea86d0f	68c06cf9-d8e9-463d-93f7-360c8daa7683	ae753320-c362-4d8b-8294-53533a1a5798	t
c6561811-ff8b-46d6-8abd-37104859478d	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	ae753320-c362-4d8b-8294-53533a1a5798	t
374bda64-ec5e-4d87-956a-3238213b3eb0	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	ae753320-c362-4d8b-8294-53533a1a5798	t
2effca87-83f3-490b-90b3-e130ed69a937	ffe05eb5-ab28-467b-9e6a-e2a88887876b	ae753320-c362-4d8b-8294-53533a1a5798	t
b0fec3c0-950b-4a3d-ae20-e6bd1024b6ed	cc6392ae-9095-409a-a453-b95fcfcc16f1	ae753320-c362-4d8b-8294-53533a1a5798	t
91ab5c33-0ae2-4bbb-803b-545e160acce9	999a870f-4b2a-4161-82d9-ba58c7a77fd2	ae753320-c362-4d8b-8294-53533a1a5798	t
3e5957a9-4751-4336-892f-fef056975af6	6d204d7f-e985-4328-90ea-cebf86b9271b	ae753320-c362-4d8b-8294-53533a1a5798	t
3e8f5b86-d1c2-4546-a467-5e48b537b0f4	2896a379-554f-49a0-9969-a0c755ce4991	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
69de43f4-d94c-43f2-8bd0-45da9799e207	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
063dbb6f-0c22-42a8-8cb5-b0b7a4652101	13846310-0456-481d-8791-66eac9f53c8f	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
9a7a47ae-d3ba-487d-b203-a0e5f63fb4a8	aed3be59-7096-4d93-ba73-375f068ac05a	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
07091d31-5c72-4ba0-bfa7-fe36a3a983d3	fce4b9ae-c28f-43bb-ba90-abf2010a693b	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
64e8dce4-e4c2-4fa5-9f4e-ac29c782a00a	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
1bdabd2d-b910-4ba9-827b-2b5f9f31229b	4db35518-a75a-427b-9f28-ada15be0f391	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
8b9e626c-fd17-4df0-900c-97e48eabdaa1	13c6c895-d834-42eb-8865-decc01d94e42	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
e2b9db46-c44a-4efd-a675-5a5a59e0a180	0af7012d-d1e2-447e-8903-19e4becd0d63	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
cad71e33-dcd7-43b5-af43-8598cce6ada6	922f4bf3-4a24-49c1-ad57-b74a05a253ab	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
058d6220-f52d-4e3f-93ea-837d4090ad45	6ac214f6-41cb-4be6-9765-df33bad3b63f	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
299d8645-4c7f-4d67-b349-3f7e5b2837b0	bc914e7f-4401-4448-aca9-9c058ae999b3	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
79b7ba2c-d8bf-48f1-9d87-a624a6f7eab1	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
cdd9f8d7-82a6-46be-8d82-811d1347dc13	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
301fa2a5-c31d-47c5-bc69-6e6197281781	c0fbd9f3-9271-433c-9075-d96b25eba0e9	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
e82045e1-a34e-4d34-b237-ad196ddc8eac	ea9057ff-1aa1-4565-b084-f743a4a3d975	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
dfcc24d1-0141-4028-8f14-4075cf20ab98	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
94545c83-e172-4c41-86f5-851d813f95d5	68c06cf9-d8e9-463d-93f7-360c8daa7683	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
2c967160-b6c7-47c0-844c-fa9b16d1ff4e	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
a3490bea-fe2b-4c05-b278-380ed7fdcdc4	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
01d7794f-97e6-4f1d-bf0b-f8a4cec14ab5	ffe05eb5-ab28-467b-9e6a-e2a88887876b	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
5066d617-18a9-44d6-9cd1-fa5d634831ed	cc6392ae-9095-409a-a453-b95fcfcc16f1	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
b126da12-2fdb-4864-8080-9dfda51ce242	999a870f-4b2a-4161-82d9-ba58c7a77fd2	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
9a67acd4-e07c-4218-aae3-cf7c505411a9	6d204d7f-e985-4328-90ea-cebf86b9271b	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
e471fd3e-4169-49e5-80cb-e90abcd7e72b	2896a379-554f-49a0-9969-a0c755ce4991	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
ecec9806-f606-450e-98f4-87b8e0b2bdc0	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
a27e9c60-9101-440e-9203-7a94e3036a0d	13846310-0456-481d-8791-66eac9f53c8f	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
cb48fc24-a23d-45cf-8668-d9dbe7a5f810	aed3be59-7096-4d93-ba73-375f068ac05a	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
bea9480a-1092-4382-9ccf-31d51ac9721a	fce4b9ae-c28f-43bb-ba90-abf2010a693b	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
9a58070e-2889-47d7-84dd-a387585726e3	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
e3364ad7-0010-4058-9939-5d95970ccd5d	4db35518-a75a-427b-9f28-ada15be0f391	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
871fc20b-804f-41e0-8342-2180ce35a142	13c6c895-d834-42eb-8865-decc01d94e42	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
9a936832-ee8e-40f8-9a0e-0c835440c3e1	0af7012d-d1e2-447e-8903-19e4becd0d63	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
5bb6973c-4025-48b8-9e10-4a8c9e9d6ee3	922f4bf3-4a24-49c1-ad57-b74a05a253ab	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
d1de8ae0-da7a-46fa-9398-532d333d5d7e	6ac214f6-41cb-4be6-9765-df33bad3b63f	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
06e23789-2770-4a64-8acd-9c29aab89c98	bc914e7f-4401-4448-aca9-9c058ae999b3	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
d4c9261f-7e6a-49ad-a490-8f3625576ee9	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
ce360340-cf13-4888-83b5-cc01ecdf9122	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
d790f905-95a5-4707-b454-95868ad261cc	c0fbd9f3-9271-433c-9075-d96b25eba0e9	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
e69b71f3-5ca0-4265-bc00-03ee315a010f	ea9057ff-1aa1-4565-b084-f743a4a3d975	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
dce55d67-92c7-4766-8a95-36b8a70e6b7a	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
9c6eb7c5-be2d-4e1d-806a-96e0005e8cf1	68c06cf9-d8e9-463d-93f7-360c8daa7683	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
fcae9e70-e052-40c4-bcf6-547b0f0d4591	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
fb2381e9-cc48-4863-b42a-456fea6b0a5a	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
1361378d-02a9-4de2-9a31-a77521f7b2d8	ffe05eb5-ab28-467b-9e6a-e2a88887876b	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
4ed918b2-8c4d-44dc-9ca9-ab0bf4b2c6d6	cc6392ae-9095-409a-a453-b95fcfcc16f1	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
60c40cb1-c61d-433a-8d05-45e753064089	999a870f-4b2a-4161-82d9-ba58c7a77fd2	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
7b122b89-feef-4fea-8dcd-08e5a3f592b8	6d204d7f-e985-4328-90ea-cebf86b9271b	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
be8096be-0136-4215-b9ea-6569c390daa2	2896a379-554f-49a0-9969-a0c755ce4991	65ef7119-ea28-4a7a-9329-fcef962e4343	f
33126e48-5465-456e-a593-4ee62b477b77	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	65ef7119-ea28-4a7a-9329-fcef962e4343	f
56e6dede-316a-4dd4-b535-5370ca2c7ff6	13846310-0456-481d-8791-66eac9f53c8f	65ef7119-ea28-4a7a-9329-fcef962e4343	f
a5749e44-480f-4f2d-8089-3b81136ac417	aed3be59-7096-4d93-ba73-375f068ac05a	65ef7119-ea28-4a7a-9329-fcef962e4343	t
a1babf99-468c-47c9-a4c9-f4ebef1dd29a	fce4b9ae-c28f-43bb-ba90-abf2010a693b	65ef7119-ea28-4a7a-9329-fcef962e4343	t
3d73e1a8-368f-4a14-a274-0b2988598539	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	65ef7119-ea28-4a7a-9329-fcef962e4343	t
36b10c31-0c28-4aeb-ad45-b509e57d9364	4db35518-a75a-427b-9f28-ada15be0f391	65ef7119-ea28-4a7a-9329-fcef962e4343	t
7a2b3a5e-6aa6-4db0-b961-c4fb79b2549c	13c6c895-d834-42eb-8865-decc01d94e42	65ef7119-ea28-4a7a-9329-fcef962e4343	t
187a79a0-debb-4f5f-bba3-604dcdf4437a	0af7012d-d1e2-447e-8903-19e4becd0d63	65ef7119-ea28-4a7a-9329-fcef962e4343	t
9cc83c2f-7e80-42a9-95b9-2a6345d547df	922f4bf3-4a24-49c1-ad57-b74a05a253ab	65ef7119-ea28-4a7a-9329-fcef962e4343	t
77247160-3d28-4e80-8a1d-2bca7e83dd77	6ac214f6-41cb-4be6-9765-df33bad3b63f	65ef7119-ea28-4a7a-9329-fcef962e4343	t
8427eafb-ce47-4598-8282-2f2b53eefbe1	bc914e7f-4401-4448-aca9-9c058ae999b3	65ef7119-ea28-4a7a-9329-fcef962e4343	t
40437cae-936b-414f-98a7-8c6b017cf36d	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	65ef7119-ea28-4a7a-9329-fcef962e4343	f
21c45ffe-9935-4130-a25d-ee232b0b780a	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	65ef7119-ea28-4a7a-9329-fcef962e4343	t
33dd5e4d-dafe-4400-a776-eec4a79b322d	c0fbd9f3-9271-433c-9075-d96b25eba0e9	65ef7119-ea28-4a7a-9329-fcef962e4343	t
6693dc07-8f90-4ac6-a620-d75a0708307a	ea9057ff-1aa1-4565-b084-f743a4a3d975	65ef7119-ea28-4a7a-9329-fcef962e4343	t
fd164bed-0370-4e8d-9172-05bc35393282	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	65ef7119-ea28-4a7a-9329-fcef962e4343	t
e75e8840-2d26-4f4c-a262-adef144b1b9b	68c06cf9-d8e9-463d-93f7-360c8daa7683	65ef7119-ea28-4a7a-9329-fcef962e4343	t
174f507c-1674-4b75-843c-ac69d745543e	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	65ef7119-ea28-4a7a-9329-fcef962e4343	t
e3d6e10a-9785-4e9b-99c1-5c45cba6b949	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	65ef7119-ea28-4a7a-9329-fcef962e4343	t
357aaca3-3432-4a25-9217-f6a7dd5382f7	ffe05eb5-ab28-467b-9e6a-e2a88887876b	65ef7119-ea28-4a7a-9329-fcef962e4343	t
87b1915c-c97d-457f-837d-7be58643f53e	cc6392ae-9095-409a-a453-b95fcfcc16f1	65ef7119-ea28-4a7a-9329-fcef962e4343	f
f33a7efb-0bfe-4b6d-8a5a-da87f4fa5a7b	999a870f-4b2a-4161-82d9-ba58c7a77fd2	65ef7119-ea28-4a7a-9329-fcef962e4343	t
5839f63f-97c3-45f9-9250-fb01166d3303	6d204d7f-e985-4328-90ea-cebf86b9271b	65ef7119-ea28-4a7a-9329-fcef962e4343	t
bc5f5c35-f728-45e4-a68a-b1e73fc2b2fc	2896a379-554f-49a0-9969-a0c755ce4991	c1c97976-38c1-4174-b028-57b0273c7fac	f
c5f30f68-a56e-44f2-87ca-6985f08849fa	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	c1c97976-38c1-4174-b028-57b0273c7fac	f
0eb36dbe-513a-4238-bd10-4a60ee02397d	13846310-0456-481d-8791-66eac9f53c8f	c1c97976-38c1-4174-b028-57b0273c7fac	t
8baf2fd2-354b-4e98-bb23-7ec6e433206c	aed3be59-7096-4d93-ba73-375f068ac05a	c1c97976-38c1-4174-b028-57b0273c7fac	f
da4a3f6d-1dde-46ce-a010-c6a2cdfea59e	fce4b9ae-c28f-43bb-ba90-abf2010a693b	c1c97976-38c1-4174-b028-57b0273c7fac	t
bb496e20-6592-41f1-aef2-1a09fa1578bd	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	c1c97976-38c1-4174-b028-57b0273c7fac	t
8b037fec-4911-44af-ba64-f85acf286a30	4db35518-a75a-427b-9f28-ada15be0f391	c1c97976-38c1-4174-b028-57b0273c7fac	t
5863341c-5e6b-42ae-9fb9-2c1310bd7d4a	13c6c895-d834-42eb-8865-decc01d94e42	c1c97976-38c1-4174-b028-57b0273c7fac	t
aceb5e01-cccb-4762-92d5-cf749c026784	0af7012d-d1e2-447e-8903-19e4becd0d63	c1c97976-38c1-4174-b028-57b0273c7fac	t
4d299fd0-82dd-4cf5-a014-729bb77bd9cb	922f4bf3-4a24-49c1-ad57-b74a05a253ab	c1c97976-38c1-4174-b028-57b0273c7fac	t
33a6e466-c320-4d51-abaa-e834c95a2d0f	6ac214f6-41cb-4be6-9765-df33bad3b63f	c1c97976-38c1-4174-b028-57b0273c7fac	t
42e85548-3f76-4f95-b894-5999bf146103	bc914e7f-4401-4448-aca9-9c058ae999b3	c1c97976-38c1-4174-b028-57b0273c7fac	t
9c69fd8f-e659-4537-840e-2edb7c69cca4	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	c1c97976-38c1-4174-b028-57b0273c7fac	t
3281d6bf-64a3-4645-bbed-ac88011b3983	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	c1c97976-38c1-4174-b028-57b0273c7fac	t
aede5d9a-d36c-4a85-8a02-22f0cbf2e68a	c0fbd9f3-9271-433c-9075-d96b25eba0e9	c1c97976-38c1-4174-b028-57b0273c7fac	t
cbfecc71-e0e1-4f96-933b-1b5de2b681e3	ea9057ff-1aa1-4565-b084-f743a4a3d975	c1c97976-38c1-4174-b028-57b0273c7fac	t
91855f7b-9084-4dd9-8521-9edeee2375e5	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	c1c97976-38c1-4174-b028-57b0273c7fac	t
506c24c7-d4b6-44e3-b642-faae0b530e35	68c06cf9-d8e9-463d-93f7-360c8daa7683	c1c97976-38c1-4174-b028-57b0273c7fac	t
d24826c9-2005-490e-b53c-7a2c54fd8d25	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	c1c97976-38c1-4174-b028-57b0273c7fac	t
60efd936-083c-4225-b91b-98522308a4da	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	c1c97976-38c1-4174-b028-57b0273c7fac	t
acdac1ba-5b7b-40be-b1ba-17a7682e4b38	ffe05eb5-ab28-467b-9e6a-e2a88887876b	c1c97976-38c1-4174-b028-57b0273c7fac	t
2014fe13-1b1b-4234-92be-3c65a9dbd38b	cc6392ae-9095-409a-a453-b95fcfcc16f1	c1c97976-38c1-4174-b028-57b0273c7fac	t
dd3acff3-aa32-4856-950a-7b8bef659037	999a870f-4b2a-4161-82d9-ba58c7a77fd2	c1c97976-38c1-4174-b028-57b0273c7fac	t
d1cc2af4-37d8-4606-b453-bf742cf6891b	6d204d7f-e985-4328-90ea-cebf86b9271b	c1c97976-38c1-4174-b028-57b0273c7fac	t
057aa066-ba2d-4db1-8f08-e94ffd1b4d9b	2896a379-554f-49a0-9969-a0c755ce4991	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
4a266778-8f70-45f8-8f8d-1aea4c9e9a9e	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
02e1276b-6096-47aa-a14a-9ada6a8053e2	13846310-0456-481d-8791-66eac9f53c8f	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
fedb287a-3369-4156-9816-ac00e21137cf	aed3be59-7096-4d93-ba73-375f068ac05a	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
49db7475-408f-40af-9fd6-abc76b7eb341	fce4b9ae-c28f-43bb-ba90-abf2010a693b	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
eb16aacd-e50d-4c42-93aa-ed521eb6ffbd	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
48801d80-52ae-4682-8a62-4a98219fc64c	4db35518-a75a-427b-9f28-ada15be0f391	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
a3642a68-efa0-427d-ac1b-156315959d14	13c6c895-d834-42eb-8865-decc01d94e42	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
e663cde9-1c87-46e5-9ecf-bc2dfde402c0	0af7012d-d1e2-447e-8903-19e4becd0d63	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
f83bd9c5-2593-405a-93dc-448901935af5	922f4bf3-4a24-49c1-ad57-b74a05a253ab	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
861171eb-ac75-4905-b1f0-3f8c41da02a8	6ac214f6-41cb-4be6-9765-df33bad3b63f	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
d207274b-29a1-47f5-8e07-09f49375ff4b	bc914e7f-4401-4448-aca9-9c058ae999b3	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
5421f62d-8fed-499c-9c07-4ca4e8edcc5d	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
dad119b6-7b3d-404d-a6e3-9f7e0ec17841	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
b771ad36-898d-44db-968a-da409fc43f96	c0fbd9f3-9271-433c-9075-d96b25eba0e9	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
909d8c25-3497-4e1c-9265-cba21b91834c	ea9057ff-1aa1-4565-b084-f743a4a3d975	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
16acd3fa-a375-432d-8cd9-3cb924d10865	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
12a41498-6ec2-4e14-a51e-b031fdba6db1	68c06cf9-d8e9-463d-93f7-360c8daa7683	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
55660099-d791-4106-b34d-dc25b1f41c65	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
ebe0f6c4-c34e-45c5-8395-4c8c90d9ee00	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
dc1add59-a47e-46aa-863d-c1a1944869e6	ffe05eb5-ab28-467b-9e6a-e2a88887876b	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
718d54b4-be29-4cda-a757-3afeee758244	cc6392ae-9095-409a-a453-b95fcfcc16f1	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
f12b5ed9-4532-45fe-8743-49b5f5ee6c98	999a870f-4b2a-4161-82d9-ba58c7a77fd2	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
403f3576-8385-4c04-926a-75190cf70c30	6d204d7f-e985-4328-90ea-cebf86b9271b	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
5c1000ce-588c-40ad-abe7-9d86d2ac7100	2896a379-554f-49a0-9969-a0c755ce4991	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
f91d6921-6702-4c34-9de5-0e37d3a708d2	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
d199c1b6-9b44-45ec-b7c2-4f99afd3e8de	13846310-0456-481d-8791-66eac9f53c8f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
23ca5dac-08b4-4bd2-80a2-04360adcacf8	aed3be59-7096-4d93-ba73-375f068ac05a	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
c266993b-9db5-4441-8765-e6e63a771e34	fce4b9ae-c28f-43bb-ba90-abf2010a693b	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
fe3618c6-d8f8-4706-9d5c-3c9154cc9dd5	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
bcbdf608-29e4-404c-ae4f-918bcdde6ef3	4db35518-a75a-427b-9f28-ada15be0f391	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
645cf4a7-90cb-4178-b2af-bb1ed6f387ef	13c6c895-d834-42eb-8865-decc01d94e42	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
981178b6-3101-4411-837a-c25373ab3c87	0af7012d-d1e2-447e-8903-19e4becd0d63	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
83f602ec-4b9d-4226-844c-6463fd4de615	922f4bf3-4a24-49c1-ad57-b74a05a253ab	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
c01da5dd-869e-486e-9ff3-f4113591238a	6ac214f6-41cb-4be6-9765-df33bad3b63f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
23d84275-dff5-485c-882b-95ee45b12993	bc914e7f-4401-4448-aca9-9c058ae999b3	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
8aee3244-9072-414f-8a53-6eccff283f42	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
7bcbaaa6-eb21-4a79-9f72-fa77aafb9607	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
8f4afab3-9b45-4fdd-a813-5d8ab7d430b1	c0fbd9f3-9271-433c-9075-d96b25eba0e9	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
91f669ca-08df-4312-9396-aca7390ddca5	ea9057ff-1aa1-4565-b084-f743a4a3d975	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
d9599ced-d73e-4a64-96eb-f36791f0bb68	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
66043b56-aae3-40d8-8fe5-6674bc710614	68c06cf9-d8e9-463d-93f7-360c8daa7683	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
9ac95403-2bb6-4998-b030-a18e819a8cc7	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
d824d5eb-3e18-44ab-af71-858eb647aeda	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
bd217085-c3d7-46fa-8b1d-0fd3cd5a8765	ffe05eb5-ab28-467b-9e6a-e2a88887876b	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
fd55b6e8-6587-4275-9e75-58693f322484	cc6392ae-9095-409a-a453-b95fcfcc16f1	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
32eb8490-05dc-411f-b017-24b32198a4ad	999a870f-4b2a-4161-82d9-ba58c7a77fd2	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
2afe589f-c989-493f-a2eb-da672125e020	6d204d7f-e985-4328-90ea-cebf86b9271b	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
ba0cf83c-a0c4-412e-acd5-9978a64dbdfc	2896a379-554f-49a0-9969-a0c755ce4991	95465124-34e6-4104-95f7-2f6289016331	t
026c6100-9966-4a13-ac43-71cb2004ab40	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	95465124-34e6-4104-95f7-2f6289016331	t
61358836-075e-4abc-b1d3-cc4f288e536c	13846310-0456-481d-8791-66eac9f53c8f	95465124-34e6-4104-95f7-2f6289016331	f
9e013a48-714b-4b64-a605-c686977f2e65	aed3be59-7096-4d93-ba73-375f068ac05a	95465124-34e6-4104-95f7-2f6289016331	f
f88e8ed0-e078-47c5-9bc6-6e446203a057	fce4b9ae-c28f-43bb-ba90-abf2010a693b	95465124-34e6-4104-95f7-2f6289016331	t
62e439f5-75aa-49bb-b6af-b3a7bdfc9d23	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	95465124-34e6-4104-95f7-2f6289016331	t
d173a620-0a5a-4aea-86a4-5da383849893	4db35518-a75a-427b-9f28-ada15be0f391	95465124-34e6-4104-95f7-2f6289016331	t
8cc38dc2-5b4f-4b31-a2f4-ad30677a5444	13c6c895-d834-42eb-8865-decc01d94e42	95465124-34e6-4104-95f7-2f6289016331	f
4f2cb97d-7a26-4a10-92b0-c6a10e7b7778	0af7012d-d1e2-447e-8903-19e4becd0d63	95465124-34e6-4104-95f7-2f6289016331	t
b26c7a69-0007-4554-888f-4684d26aaf3d	922f4bf3-4a24-49c1-ad57-b74a05a253ab	95465124-34e6-4104-95f7-2f6289016331	f
e7c4e308-5067-4bb5-be4b-dbf9966fdfee	6ac214f6-41cb-4be6-9765-df33bad3b63f	95465124-34e6-4104-95f7-2f6289016331	t
9edf681e-7ae0-4962-a548-f0ae50c92385	bc914e7f-4401-4448-aca9-9c058ae999b3	95465124-34e6-4104-95f7-2f6289016331	t
51934440-db15-438a-aa9d-155c9a61dd0a	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	95465124-34e6-4104-95f7-2f6289016331	t
2a0118a5-9845-4d29-967f-3e104254e476	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	95465124-34e6-4104-95f7-2f6289016331	t
fe7c8965-ae85-4b15-aeac-dce0d8464c25	c0fbd9f3-9271-433c-9075-d96b25eba0e9	95465124-34e6-4104-95f7-2f6289016331	t
c46e670c-0f33-4c9c-a076-c28ccd7c060d	ea9057ff-1aa1-4565-b084-f743a4a3d975	95465124-34e6-4104-95f7-2f6289016331	t
7971b126-146e-4f90-b937-b1f3dedd5b95	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	95465124-34e6-4104-95f7-2f6289016331	t
3b5baa8c-6fe8-4940-8746-83969d1d5c0c	68c06cf9-d8e9-463d-93f7-360c8daa7683	95465124-34e6-4104-95f7-2f6289016331	t
6e9db5e8-50e4-4c6f-bee5-8ea6949d7417	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	95465124-34e6-4104-95f7-2f6289016331	t
a4d05b5f-0d5e-4c60-aaf6-c1dc529d987a	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	95465124-34e6-4104-95f7-2f6289016331	t
b9ae164d-b1a6-43cb-b46c-d83012787d75	ffe05eb5-ab28-467b-9e6a-e2a88887876b	95465124-34e6-4104-95f7-2f6289016331	t
01af8826-ef50-4901-9c3c-a13ce79d2cad	cc6392ae-9095-409a-a453-b95fcfcc16f1	95465124-34e6-4104-95f7-2f6289016331	t
e1d66d49-e760-487f-b9ed-6606324c7da7	999a870f-4b2a-4161-82d9-ba58c7a77fd2	95465124-34e6-4104-95f7-2f6289016331	t
25d893b2-eb0a-4db3-801e-da56d088b4be	6d204d7f-e985-4328-90ea-cebf86b9271b	95465124-34e6-4104-95f7-2f6289016331	t
00e5b994-76d5-4038-9a98-0d21bcc700f7	2896a379-554f-49a0-9969-a0c755ce4991	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
c8e73e8b-4225-443a-b385-c6f30b26ad3f	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
471c39a2-7cd0-437d-b838-7c6112005085	13846310-0456-481d-8791-66eac9f53c8f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
77856aa8-c8d0-4459-86e0-aa1bf96f233f	aed3be59-7096-4d93-ba73-375f068ac05a	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
bfee64f8-ec81-49ae-b1b9-d604a66e98bc	fce4b9ae-c28f-43bb-ba90-abf2010a693b	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
eccff882-21a5-44da-8de2-272f51a4622f	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
642306e5-39d8-4468-8190-a49cf08fcb49	4db35518-a75a-427b-9f28-ada15be0f391	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
f40c4595-5723-4daa-8d4a-fd783074e02d	13c6c895-d834-42eb-8865-decc01d94e42	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
35285192-57ba-4b0a-bd0e-e4ee8727cff4	0af7012d-d1e2-447e-8903-19e4becd0d63	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
ead8457f-a58c-4ffa-8a00-fd1231656c2c	922f4bf3-4a24-49c1-ad57-b74a05a253ab	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
a845df71-a2a0-49d2-9bd5-538b70d350fe	6ac214f6-41cb-4be6-9765-df33bad3b63f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
73b5db55-d6ba-402f-9447-026074ec939b	bc914e7f-4401-4448-aca9-9c058ae999b3	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
55270ea3-1f29-4dec-bc64-4705e2cf4772	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
17e8c46a-2287-40c8-9298-246b6fee0d41	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
37f468bf-0ac8-435a-abca-b6e4732b1ffd	c0fbd9f3-9271-433c-9075-d96b25eba0e9	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
19ecb10c-f22d-48fb-b701-6ceb3b66b263	ea9057ff-1aa1-4565-b084-f743a4a3d975	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
35a5ff95-cad8-424c-a674-7e310b787ba1	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
c55ce452-ecb1-4d83-81bd-3be34ef2ac17	68c06cf9-d8e9-463d-93f7-360c8daa7683	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
11be2b03-ead2-405e-bdc1-4b9f7ef0a227	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
97754e98-b31e-4890-a0a9-720254b8eda5	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
220dbf2e-4b0c-4804-ab7b-ae355a28fe34	ffe05eb5-ab28-467b-9e6a-e2a88887876b	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
02373496-8fb6-42f4-9a15-6be6f7b89a0d	cc6392ae-9095-409a-a453-b95fcfcc16f1	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
10471b13-2b4d-415f-8c39-40ebc31eb1ab	999a870f-4b2a-4161-82d9-ba58c7a77fd2	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
2d37c50e-d84f-4cab-9400-ce9044618730	6d204d7f-e985-4328-90ea-cebf86b9271b	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
c0cd3900-b8b8-4a12-a3d7-64cc8a9cf6b7	2896a379-554f-49a0-9969-a0c755ce4991	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
d3ca743d-fbb3-4d56-bf70-ce0b9a8b9365	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
a62d24ee-65c2-45e6-8ad7-cb0eaf838e71	13846310-0456-481d-8791-66eac9f53c8f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
397f6d79-5eca-47db-8c6d-967ccc2f299e	aed3be59-7096-4d93-ba73-375f068ac05a	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
828a96bd-5ab6-4664-8f5d-14210f2559c4	fce4b9ae-c28f-43bb-ba90-abf2010a693b	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
a1df12df-ad11-4899-b244-12a20b4d052d	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
36803abf-10a4-4d51-8b1d-2fedee3d3342	4db35518-a75a-427b-9f28-ada15be0f391	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
1f94385d-6441-4cb8-8b08-e9823942b21f	13c6c895-d834-42eb-8865-decc01d94e42	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
19840470-4687-4c7b-b214-a29f1380c1b0	0af7012d-d1e2-447e-8903-19e4becd0d63	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
48fcfa77-f7d4-458a-a462-c4239ea74d29	922f4bf3-4a24-49c1-ad57-b74a05a253ab	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
c1bb20e4-44a5-462b-ba5b-8381c06b0dff	6ac214f6-41cb-4be6-9765-df33bad3b63f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
52e09065-d7a4-48c3-9091-e60b54f77d20	bc914e7f-4401-4448-aca9-9c058ae999b3	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
17dd466b-a657-40a6-9e7a-7e0f5d629535	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
673e23fb-bd06-42d7-8b9b-4d0b9cf45586	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
09fae64b-0c5d-4284-b121-d3aa9361101b	c0fbd9f3-9271-433c-9075-d96b25eba0e9	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
aef8e38b-d2c5-4dce-84ac-b0c53e314c1d	ea9057ff-1aa1-4565-b084-f743a4a3d975	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
cbb2c3bc-ed0c-4bcc-88f2-7d39b7dd7ba0	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
957f150f-31e0-4601-a022-a6630575a54d	68c06cf9-d8e9-463d-93f7-360c8daa7683	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
92924774-51f6-4670-9df4-241cc5f56001	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
298f5f47-accc-4583-b578-3478ba1ee514	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
01e03dec-8632-4517-b928-e7bd20fbbebc	ffe05eb5-ab28-467b-9e6a-e2a88887876b	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
adbe506f-ef6c-4282-b9ed-fa3cfd9d3619	cc6392ae-9095-409a-a453-b95fcfcc16f1	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
0c7abcad-d5ac-4166-9042-301d4c982334	999a870f-4b2a-4161-82d9-ba58c7a77fd2	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
3e542c6a-dc4c-48b0-ae26-72b781a2d2c6	6d204d7f-e985-4328-90ea-cebf86b9271b	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
db2a517b-1793-400f-bc19-fa8dd95b89d5	2896a379-554f-49a0-9969-a0c755ce4991	a78272dc-151f-400f-a0b4-1eeec317739c	t
076c9faa-8102-4def-a5c7-2b850bc6766e	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	a78272dc-151f-400f-a0b4-1eeec317739c	t
395e8ada-2995-4ab7-90b8-94e5bf469eb1	13846310-0456-481d-8791-66eac9f53c8f	a78272dc-151f-400f-a0b4-1eeec317739c	t
f4c41ae1-e578-410a-bcad-c0fffc130e77	aed3be59-7096-4d93-ba73-375f068ac05a	a78272dc-151f-400f-a0b4-1eeec317739c	t
b4987c3e-4589-485b-9f51-db98498e727c	fce4b9ae-c28f-43bb-ba90-abf2010a693b	a78272dc-151f-400f-a0b4-1eeec317739c	t
792b6198-f745-440e-8112-bf21f8f13ef2	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	a78272dc-151f-400f-a0b4-1eeec317739c	t
83be58f7-426b-4aff-987a-abf45c7decac	4db35518-a75a-427b-9f28-ada15be0f391	a78272dc-151f-400f-a0b4-1eeec317739c	t
441a8214-f6e8-4d50-90e8-cd0a3e035982	13c6c895-d834-42eb-8865-decc01d94e42	a78272dc-151f-400f-a0b4-1eeec317739c	t
d57038f4-dab0-49d5-a594-6698c76c0dea	0af7012d-d1e2-447e-8903-19e4becd0d63	a78272dc-151f-400f-a0b4-1eeec317739c	t
9b590916-1068-4a34-a6b4-b72de58e02f9	922f4bf3-4a24-49c1-ad57-b74a05a253ab	a78272dc-151f-400f-a0b4-1eeec317739c	t
ef3325f5-e7e9-46ab-aa4e-0e8ba2fccb0c	6ac214f6-41cb-4be6-9765-df33bad3b63f	a78272dc-151f-400f-a0b4-1eeec317739c	t
500bb974-0cf4-4aed-a4b1-514a625286cf	bc914e7f-4401-4448-aca9-9c058ae999b3	a78272dc-151f-400f-a0b4-1eeec317739c	t
34146440-3cde-43e7-b694-ce7785978f04	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	a78272dc-151f-400f-a0b4-1eeec317739c	t
e5f0c128-0ef4-42cd-b405-8c76ad7d4f05	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	a78272dc-151f-400f-a0b4-1eeec317739c	t
92d3bf40-6142-49b2-bba4-926b5a0b7170	c0fbd9f3-9271-433c-9075-d96b25eba0e9	a78272dc-151f-400f-a0b4-1eeec317739c	t
304d0fda-92c6-4977-a328-85b092b009c5	ea9057ff-1aa1-4565-b084-f743a4a3d975	a78272dc-151f-400f-a0b4-1eeec317739c	t
b3b4b340-46ee-4b42-ab7a-9e273f25bf62	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	a78272dc-151f-400f-a0b4-1eeec317739c	t
bfd1b8bb-019d-412d-88d6-5a49f85d7969	68c06cf9-d8e9-463d-93f7-360c8daa7683	a78272dc-151f-400f-a0b4-1eeec317739c	t
480595cd-5382-48b9-89d8-8d6404f3ddba	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	a78272dc-151f-400f-a0b4-1eeec317739c	t
b78cf307-6f3c-4c70-b862-a325552e14a5	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	a78272dc-151f-400f-a0b4-1eeec317739c	t
b75de786-b872-473d-b204-150b60164b95	ffe05eb5-ab28-467b-9e6a-e2a88887876b	a78272dc-151f-400f-a0b4-1eeec317739c	t
ccab1f7f-c9fc-4c6a-8573-ece0dccc335e	cc6392ae-9095-409a-a453-b95fcfcc16f1	a78272dc-151f-400f-a0b4-1eeec317739c	t
2ac499ea-ddb9-4dfe-bf7a-9d28a5beed57	999a870f-4b2a-4161-82d9-ba58c7a77fd2	a78272dc-151f-400f-a0b4-1eeec317739c	t
754708ea-dc23-4df3-80e2-02caf60a83a8	6d204d7f-e985-4328-90ea-cebf86b9271b	a78272dc-151f-400f-a0b4-1eeec317739c	t
3bce0874-4750-49ce-841e-e3f4bdacf424	2896a379-554f-49a0-9969-a0c755ce4991	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
258d2f25-4c3f-497e-a3f3-577bbc462359	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
c34dd8b9-fa8e-4f42-8e3b-b086a1ed6f2a	13846310-0456-481d-8791-66eac9f53c8f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
d83e767e-ec08-42fc-844e-784929ce6acf	aed3be59-7096-4d93-ba73-375f068ac05a	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
3b3a5170-2e7c-4661-9682-8db03103bb6a	fce4b9ae-c28f-43bb-ba90-abf2010a693b	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
3fcc26e5-0064-432e-afb4-dbcf9548acc0	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
bdcb293c-2924-494e-af10-8d12b8dfb077	4db35518-a75a-427b-9f28-ada15be0f391	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
ad2dd1d0-a363-4872-a0fd-bd7cd5b46fa4	13c6c895-d834-42eb-8865-decc01d94e42	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
2ccd273a-da54-47b8-b1bd-d0cc12443f8b	0af7012d-d1e2-447e-8903-19e4becd0d63	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
254acd85-f1cb-434e-a5b2-12185116c42f	922f4bf3-4a24-49c1-ad57-b74a05a253ab	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
1e1b36ed-062e-46ba-8bb2-d2b9cbae6c39	6ac214f6-41cb-4be6-9765-df33bad3b63f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
7ef33f48-bebc-4302-b9b3-5903de731b63	bc914e7f-4401-4448-aca9-9c058ae999b3	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
04bbc1b1-06f7-4051-b0fa-4209fdabf15e	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
b6164bd4-026b-40b6-ac76-47d936da90ab	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
6759b3eb-baa0-4609-b464-0f117f4f8ae5	c0fbd9f3-9271-433c-9075-d96b25eba0e9	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
c13aa622-beaf-42c9-a45f-cb3714261810	ea9057ff-1aa1-4565-b084-f743a4a3d975	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
01c3f462-4cec-4b4a-88be-368021c4b715	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
fe346173-c79b-44d8-8ea8-5fcb19580877	68c06cf9-d8e9-463d-93f7-360c8daa7683	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
b2d4dc12-77c0-425e-a392-a1429d45c81c	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
4e6e5c0f-0f7d-4d75-97d8-a790447cc0cf	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
c9dcc8ca-88f5-4fa0-86b9-400bb915dc87	ffe05eb5-ab28-467b-9e6a-e2a88887876b	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
5f6cccdc-4f03-4ed1-94c3-3edc49c9c23c	cc6392ae-9095-409a-a453-b95fcfcc16f1	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
4fdbc795-25ee-4125-8668-e5acca768bae	999a870f-4b2a-4161-82d9-ba58c7a77fd2	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
6cc79639-b05a-4dec-87e7-9a0a1e232819	6d204d7f-e985-4328-90ea-cebf86b9271b	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
ec675f66-bf80-43b3-a065-f0e53af975d5	2896a379-554f-49a0-9969-a0c755ce4991	47d8c413-5440-4d05-90cb-0757217fdfaf	t
b12b2477-3674-4424-84db-b32ba7827515	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	47d8c413-5440-4d05-90cb-0757217fdfaf	t
2b806301-f959-4635-b751-cb2df1c0d0a9	13846310-0456-481d-8791-66eac9f53c8f	47d8c413-5440-4d05-90cb-0757217fdfaf	t
ff6dabfc-37ea-468c-ab4c-8e689ade3db4	aed3be59-7096-4d93-ba73-375f068ac05a	47d8c413-5440-4d05-90cb-0757217fdfaf	t
67a47fb5-17df-4fbd-aeff-0f9fd92e56dc	fce4b9ae-c28f-43bb-ba90-abf2010a693b	47d8c413-5440-4d05-90cb-0757217fdfaf	t
dd47eb5f-7b3e-46ec-8529-c29b8f199230	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	47d8c413-5440-4d05-90cb-0757217fdfaf	t
88913b91-c211-4333-a5c0-c0fc39e41789	4db35518-a75a-427b-9f28-ada15be0f391	47d8c413-5440-4d05-90cb-0757217fdfaf	t
49560158-3991-4d34-8b28-87b1b18d4e7c	13c6c895-d834-42eb-8865-decc01d94e42	47d8c413-5440-4d05-90cb-0757217fdfaf	f
91645b66-9779-402b-b89e-0b4afd62a604	0af7012d-d1e2-447e-8903-19e4becd0d63	47d8c413-5440-4d05-90cb-0757217fdfaf	t
be0055b4-6db3-4727-acb8-0af5bf59f4cb	922f4bf3-4a24-49c1-ad57-b74a05a253ab	47d8c413-5440-4d05-90cb-0757217fdfaf	t
84a94e7f-f5e8-4ba2-aea9-fb28b8a2b239	6ac214f6-41cb-4be6-9765-df33bad3b63f	47d8c413-5440-4d05-90cb-0757217fdfaf	t
f0bc8597-536c-4d82-add5-eb1ec5aa8578	bc914e7f-4401-4448-aca9-9c058ae999b3	47d8c413-5440-4d05-90cb-0757217fdfaf	t
33ace39b-ef92-4867-8114-2df20e5fca8d	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	47d8c413-5440-4d05-90cb-0757217fdfaf	t
92dc074e-89f3-46ea-8516-03fe0cb0bf21	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	47d8c413-5440-4d05-90cb-0757217fdfaf	f
25407295-9c28-46bb-9f05-1109937b297d	c0fbd9f3-9271-433c-9075-d96b25eba0e9	47d8c413-5440-4d05-90cb-0757217fdfaf	t
b7029f8c-a999-4d5d-b085-c3a055110d14	ea9057ff-1aa1-4565-b084-f743a4a3d975	47d8c413-5440-4d05-90cb-0757217fdfaf	f
3c1bde84-19e0-4bce-a79e-0cf1906f5fe6	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	47d8c413-5440-4d05-90cb-0757217fdfaf	t
9beed068-dc12-4487-a7f1-0c11b5cec33b	68c06cf9-d8e9-463d-93f7-360c8daa7683	47d8c413-5440-4d05-90cb-0757217fdfaf	t
1ebb08f9-81df-4761-b078-157667f824b4	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	47d8c413-5440-4d05-90cb-0757217fdfaf	t
2e93f7ad-3f60-48c3-ba02-6b478aff410f	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	47d8c413-5440-4d05-90cb-0757217fdfaf	t
4b34ed63-790d-4910-b738-e7c4004f7b70	ffe05eb5-ab28-467b-9e6a-e2a88887876b	47d8c413-5440-4d05-90cb-0757217fdfaf	t
537eaffc-d877-410d-9413-f9e3a555d3a4	cc6392ae-9095-409a-a453-b95fcfcc16f1	47d8c413-5440-4d05-90cb-0757217fdfaf	t
213786df-38ec-4601-b813-85b406db0e6b	999a870f-4b2a-4161-82d9-ba58c7a77fd2	47d8c413-5440-4d05-90cb-0757217fdfaf	t
c52c9283-6348-451c-b0c7-8db5b3b41c8a	6d204d7f-e985-4328-90ea-cebf86b9271b	47d8c413-5440-4d05-90cb-0757217fdfaf	f
6cf07692-0298-439d-8038-699a2f33dab6	2896a379-554f-49a0-9969-a0c755ce4991	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
17f76dc5-1c01-494a-9176-a700189aa69d	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
3116b804-a3ea-4ed5-8fe3-e0f8c6c7f591	13846310-0456-481d-8791-66eac9f53c8f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
42780147-4782-4808-bdfa-9a000c72f638	aed3be59-7096-4d93-ba73-375f068ac05a	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
8c162b83-7c5e-4214-ac88-b932d1b34d28	fce4b9ae-c28f-43bb-ba90-abf2010a693b	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
a88f996f-aed2-48e7-b826-8fdcbfae7693	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
661fce91-00d5-4c5c-b461-d96a339a00f4	4db35518-a75a-427b-9f28-ada15be0f391	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
10646b75-a681-4b34-8e57-020ea19f61e1	13c6c895-d834-42eb-8865-decc01d94e42	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
e2f0d97d-30ac-4f67-bf47-9519d5f19afb	0af7012d-d1e2-447e-8903-19e4becd0d63	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
ef29b022-ddd6-460e-954c-0863b3bc0f24	922f4bf3-4a24-49c1-ad57-b74a05a253ab	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
37a52ca0-ac3f-44a4-8c02-89ea2be6db6e	6ac214f6-41cb-4be6-9765-df33bad3b63f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
bd2c7149-10f0-4e8b-9cae-c95ebae2003a	bc914e7f-4401-4448-aca9-9c058ae999b3	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
b1b74751-fae5-4961-bbfa-9315e949294e	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
ba4f73aa-005b-4b99-afcc-2d2c577fa9b5	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
a3bb3d44-02ca-49ed-96ca-a0be1ff51709	c0fbd9f3-9271-433c-9075-d96b25eba0e9	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
20365d5f-f95a-4fb8-a478-006453e65200	ea9057ff-1aa1-4565-b084-f743a4a3d975	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
4521f483-ed2d-4564-8c99-e0b5f89f1b15	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
31fe3b90-5128-452a-820e-e1cbe1208974	68c06cf9-d8e9-463d-93f7-360c8daa7683	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
addf1415-b671-4229-ba52-01a67c38e9f1	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
fbc61cf4-5cb4-4e3f-93b3-6811486bb0a3	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
7175a4de-92d6-4997-b0d5-4cde92112793	ffe05eb5-ab28-467b-9e6a-e2a88887876b	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
46e2cfa2-b8ef-45d2-ac43-7b8b877a46a5	cc6392ae-9095-409a-a453-b95fcfcc16f1	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
382bf653-4463-4cda-bd2e-238f518f35ed	999a870f-4b2a-4161-82d9-ba58c7a77fd2	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
9d701ebb-ef2a-40cc-8d98-73698e886bab	6d204d7f-e985-4328-90ea-cebf86b9271b	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
751e3e3c-7dea-44e7-954b-d3dd1d99ffa2	2896a379-554f-49a0-9969-a0c755ce4991	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
5147f9b1-61f4-4f52-842c-d169abfcf140	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
84d99ccf-470b-42e3-8a69-ae7f25e71e10	13846310-0456-481d-8791-66eac9f53c8f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
79c080f9-ced6-4d31-80a9-9ab999efe0ad	aed3be59-7096-4d93-ba73-375f068ac05a	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
1115b04a-6ff4-47eb-8463-ad6f44ee9d38	fce4b9ae-c28f-43bb-ba90-abf2010a693b	d1dce1c9-e82b-4efb-8d22-00117a37b94a	f
e665648a-aab9-4bfa-9f29-c4266ae9f815	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
f930b4b1-4771-49dd-b638-e35bdf6eb700	4db35518-a75a-427b-9f28-ada15be0f391	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
03edb47c-2e4a-4a62-9c89-27d4f5475a8d	13c6c895-d834-42eb-8865-decc01d94e42	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
27aaca9f-824a-4e56-87b1-d476c5c9d5a3	0af7012d-d1e2-447e-8903-19e4becd0d63	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
e11aeb96-c080-429e-b8a8-4aaa16e04925	922f4bf3-4a24-49c1-ad57-b74a05a253ab	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
565e89ab-9321-4cea-97c7-999640035e2c	6ac214f6-41cb-4be6-9765-df33bad3b63f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
39ebc5d8-6494-450a-a2be-1d314859c3b7	bc914e7f-4401-4448-aca9-9c058ae999b3	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
50b359dc-e18c-4c66-be5d-e9f447f4263a	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
18344e64-eac5-4a54-a5a5-34331e899915	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
472ae4db-52fe-45c3-af7e-a73a34a0d73b	c0fbd9f3-9271-433c-9075-d96b25eba0e9	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
a4914e9a-c75c-43fb-becf-645161d8e6d4	ea9057ff-1aa1-4565-b084-f743a4a3d975	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
25084b26-ed5f-4a62-8d12-6c6d25215cc9	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	d1dce1c9-e82b-4efb-8d22-00117a37b94a	f
1d82f42d-6a0b-4efe-8d39-0c5c8923f726	68c06cf9-d8e9-463d-93f7-360c8daa7683	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
dea92518-199a-445e-8159-e01e7cc9fe3b	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	d1dce1c9-e82b-4efb-8d22-00117a37b94a	f
975084a7-e44c-4ca1-bcc7-3f5aa26f21d9	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
1ac491da-565a-428b-b52b-ba1ded992550	ffe05eb5-ab28-467b-9e6a-e2a88887876b	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
b08a449b-6b18-48a3-91b5-01d78e2a0ced	cc6392ae-9095-409a-a453-b95fcfcc16f1	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
5c0a0a00-f023-4ec3-bcf0-ae11b258de62	999a870f-4b2a-4161-82d9-ba58c7a77fd2	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
e85dbe00-7de8-4f86-bc45-9a2a606a8579	6d204d7f-e985-4328-90ea-cebf86b9271b	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
11ec6144-de6a-4447-a40a-f0d91f3ed854	2896a379-554f-49a0-9969-a0c755ce4991	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
17f2c297-442e-4e2b-8e62-71e910388305	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
a3da60f7-b689-40df-b341-764285dbbae0	13846310-0456-481d-8791-66eac9f53c8f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
e1b8c11a-f357-4106-be37-850adb6c8b90	aed3be59-7096-4d93-ba73-375f068ac05a	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
13c1b66e-8457-4892-b5ff-810afb4d62ce	fce4b9ae-c28f-43bb-ba90-abf2010a693b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	f
3b5bd419-3cdc-4ab8-b923-3b2cd61c88fe	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
39811615-3e9e-4718-b15a-5d7c2b3e561e	4db35518-a75a-427b-9f28-ada15be0f391	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
14e69455-ad14-4d75-9e5f-152b2cc23fb1	13c6c895-d834-42eb-8865-decc01d94e42	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
80b2bd27-346e-4978-8d8a-0f6706878842	0af7012d-d1e2-447e-8903-19e4becd0d63	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
5c59a2d8-ac78-473a-abc5-1f06aca913da	922f4bf3-4a24-49c1-ad57-b74a05a253ab	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
7c13a0ba-9e5c-49b1-bf81-c048cf3c874e	6ac214f6-41cb-4be6-9765-df33bad3b63f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
2b48f7a1-388d-4725-bdda-a7acf3dc3e8b	bc914e7f-4401-4448-aca9-9c058ae999b3	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
3fd6bf15-68d9-4132-8d8c-0e5479655569	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
66b02005-6b0f-4cea-9700-553239709513	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
db2aacb1-3f5c-47c4-9684-dc8b21504f18	c0fbd9f3-9271-433c-9075-d96b25eba0e9	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
76f001dc-a6c1-42a3-b0f5-969eb79c9aff	ea9057ff-1aa1-4565-b084-f743a4a3d975	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
47629c5a-18b5-47f0-8491-988cdf3fc982	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
661ce022-ac64-48de-966d-94eeca8a925c	68c06cf9-d8e9-463d-93f7-360c8daa7683	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
934b069a-4145-465e-b619-13487f19dc24	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	f
a4527c3d-874d-4ea3-bd4c-0af9eabe4321	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
d85e32b7-b404-40b6-8008-c092474cfa4b	ffe05eb5-ab28-467b-9e6a-e2a88887876b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
a76495a2-6f2e-4af9-b2b6-5f7c8128ddf4	cc6392ae-9095-409a-a453-b95fcfcc16f1	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
2910cc05-c4f4-4b47-a30d-5fc3022d7fef	999a870f-4b2a-4161-82d9-ba58c7a77fd2	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
7f323ae5-f8ce-40d5-9912-5d26139b7d5c	6d204d7f-e985-4328-90ea-cebf86b9271b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
ce877176-2f1f-498b-8faf-e8cd841c849a	2896a379-554f-49a0-9969-a0c755ce4991	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
23a5ea68-90c0-4a29-8e76-979ca511f426	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
07f31011-ebc4-478d-9306-3782c9d40a0c	13846310-0456-481d-8791-66eac9f53c8f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
a8dd4d4a-2cc8-4e8b-97c7-5c9f841d5d8e	aed3be59-7096-4d93-ba73-375f068ac05a	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
0ea8851b-db7b-4385-9b11-bdd7b8829c26	fce4b9ae-c28f-43bb-ba90-abf2010a693b	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
01485db6-4ae5-45da-9c0f-4fb4a1e0384f	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
bf2cfa2f-e2d7-42f0-a3be-18aaba2acb2a	4db35518-a75a-427b-9f28-ada15be0f391	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	f
b9c7cac5-7162-41dd-bdda-4471d5f3a1bc	13c6c895-d834-42eb-8865-decc01d94e42	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
0d7dff4b-1790-4172-b399-5bec6681068f	0af7012d-d1e2-447e-8903-19e4becd0d63	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	f
b933e322-48a2-4fe9-ab2b-c43b41d1b767	922f4bf3-4a24-49c1-ad57-b74a05a253ab	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
0e1b69bb-7002-439d-98fe-9ff4a0984c85	6ac214f6-41cb-4be6-9765-df33bad3b63f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
60f401d8-6b0f-4e8d-a42b-2739549d3e7a	bc914e7f-4401-4448-aca9-9c058ae999b3	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
d884317e-4086-45e1-a71a-5d7f40b8d6c1	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
578df770-a759-4f32-949a-20fd77be9edf	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
f192ad1a-a3d7-4b2d-bdfa-8f5d64e0d452	c0fbd9f3-9271-433c-9075-d96b25eba0e9	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
34934cf0-a16d-4418-aaa6-8f6b759809d6	ea9057ff-1aa1-4565-b084-f743a4a3d975	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
3ebe68eb-c2ec-4aaf-b2f9-ed02b3ccc136	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
162e4cfd-421f-4bf0-9d38-0d241cc3bd31	68c06cf9-d8e9-463d-93f7-360c8daa7683	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	f
99dbfcc8-7fbc-4302-8a1a-bc22837a1d8d	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
0637c201-deed-4557-843a-5ea86abc7cd3	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
b9b45847-1398-4f25-a322-79e14f21d6b6	ffe05eb5-ab28-467b-9e6a-e2a88887876b	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
e5bc2b51-4cf9-4324-b488-1bc3cc10afb1	cc6392ae-9095-409a-a453-b95fcfcc16f1	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
3057e57b-934d-4dad-b383-76d1b81e230c	999a870f-4b2a-4161-82d9-ba58c7a77fd2	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
3fe23c69-a754-42a6-a50f-e4e7ec7c0782	6d204d7f-e985-4328-90ea-cebf86b9271b	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
9d9f987e-faa9-4007-9d03-42ce8e7d4f37	2896a379-554f-49a0-9969-a0c755ce4991	e79979e1-326f-4b84-b613-ce32953d1f05	t
998a02cc-e0af-484b-a19f-1662f6b7f17e	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	e79979e1-326f-4b84-b613-ce32953d1f05	t
7502d99f-2265-4b2d-900a-e377f470a6dd	13846310-0456-481d-8791-66eac9f53c8f	e79979e1-326f-4b84-b613-ce32953d1f05	t
4936a55f-4e27-44fb-be8a-fc055c49cdfa	aed3be59-7096-4d93-ba73-375f068ac05a	e79979e1-326f-4b84-b613-ce32953d1f05	t
75236c74-13f8-4cd0-8807-18347e8cc8ce	fce4b9ae-c28f-43bb-ba90-abf2010a693b	e79979e1-326f-4b84-b613-ce32953d1f05	t
4afe37d9-02ad-43c0-8ff5-b3b0c3096c0d	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	e79979e1-326f-4b84-b613-ce32953d1f05	t
d67bffa0-43e2-432f-8f45-15b7d828be27	4db35518-a75a-427b-9f28-ada15be0f391	e79979e1-326f-4b84-b613-ce32953d1f05	t
1e931aca-e994-4e73-9561-4eaf955eac2c	13c6c895-d834-42eb-8865-decc01d94e42	e79979e1-326f-4b84-b613-ce32953d1f05	t
6d8d55c1-84ec-4f76-acdf-ac7aad7d02ea	0af7012d-d1e2-447e-8903-19e4becd0d63	e79979e1-326f-4b84-b613-ce32953d1f05	f
14d4e34d-832f-4d1f-bf21-86535bd067a9	922f4bf3-4a24-49c1-ad57-b74a05a253ab	e79979e1-326f-4b84-b613-ce32953d1f05	t
d01f4931-b910-4dfc-9d2d-9cd09347ddce	6ac214f6-41cb-4be6-9765-df33bad3b63f	e79979e1-326f-4b84-b613-ce32953d1f05	t
3c63aca5-9be9-4678-8342-1434805bb179	bc914e7f-4401-4448-aca9-9c058ae999b3	e79979e1-326f-4b84-b613-ce32953d1f05	t
33d38e59-eeac-4371-8839-d52845c2660b	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	e79979e1-326f-4b84-b613-ce32953d1f05	t
81d6536e-f30f-49a4-97be-f6708a8c6f6c	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	e79979e1-326f-4b84-b613-ce32953d1f05	t
7a8b6997-8f07-480c-9d79-d1b48e192d5d	c0fbd9f3-9271-433c-9075-d96b25eba0e9	e79979e1-326f-4b84-b613-ce32953d1f05	t
e4055a2f-fd2e-49b6-85ba-aa7360d29108	ea9057ff-1aa1-4565-b084-f743a4a3d975	e79979e1-326f-4b84-b613-ce32953d1f05	t
2cc6fda4-e51a-4626-8574-4d9b676fbb32	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	e79979e1-326f-4b84-b613-ce32953d1f05	t
d48ab13e-5c14-439c-b991-b96ef3fe9f64	68c06cf9-d8e9-463d-93f7-360c8daa7683	e79979e1-326f-4b84-b613-ce32953d1f05	t
803efb3c-853d-4af5-97a8-aee6076b27f1	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	e79979e1-326f-4b84-b613-ce32953d1f05	t
9ab12816-185a-46dd-bcbc-18af4a4f7e1d	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	e79979e1-326f-4b84-b613-ce32953d1f05	t
ae0c99f9-10e4-4ac1-b93d-a3e2a699ccb6	ffe05eb5-ab28-467b-9e6a-e2a88887876b	e79979e1-326f-4b84-b613-ce32953d1f05	f
b1490bcb-3dbe-456e-8d05-459806e1dd16	cc6392ae-9095-409a-a453-b95fcfcc16f1	e79979e1-326f-4b84-b613-ce32953d1f05	t
cac0879c-4716-4af7-95f5-afd98e89ff73	999a870f-4b2a-4161-82d9-ba58c7a77fd2	e79979e1-326f-4b84-b613-ce32953d1f05	t
7932bd35-ec4c-4c70-8eeb-5ab7b5c0f04b	6d204d7f-e985-4328-90ea-cebf86b9271b	e79979e1-326f-4b84-b613-ce32953d1f05	t
79142340-2e09-403b-a9b7-1c440b3e523a	2896a379-554f-49a0-9969-a0c755ce4991	11c8fe77-61a2-4761-b804-46106525f467	t
9d13817c-564a-4fad-b5fc-53d92823305a	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	11c8fe77-61a2-4761-b804-46106525f467	t
306defbc-c2d2-448d-8380-d10339f74030	13846310-0456-481d-8791-66eac9f53c8f	11c8fe77-61a2-4761-b804-46106525f467	t
9c45dc9c-8956-4fa0-af22-6ca750e16835	aed3be59-7096-4d93-ba73-375f068ac05a	11c8fe77-61a2-4761-b804-46106525f467	t
982d34c7-128e-4a7a-92bf-a260cd16a963	fce4b9ae-c28f-43bb-ba90-abf2010a693b	11c8fe77-61a2-4761-b804-46106525f467	f
7250fe35-0293-43d2-8508-412ab6b5984f	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	11c8fe77-61a2-4761-b804-46106525f467	t
5b730048-8366-4fb0-aa58-c36f43a8169c	4db35518-a75a-427b-9f28-ada15be0f391	11c8fe77-61a2-4761-b804-46106525f467	t
dfe4b064-a8cd-4a29-8a34-0212dbf209c5	13c6c895-d834-42eb-8865-decc01d94e42	11c8fe77-61a2-4761-b804-46106525f467	t
1e90bb57-938f-4fea-9785-30e5472486fd	0af7012d-d1e2-447e-8903-19e4becd0d63	11c8fe77-61a2-4761-b804-46106525f467	f
019d0b40-d54d-4f0f-843e-2e9c14f14930	922f4bf3-4a24-49c1-ad57-b74a05a253ab	11c8fe77-61a2-4761-b804-46106525f467	t
ba346129-fe13-45d9-a903-608d41d78061	6ac214f6-41cb-4be6-9765-df33bad3b63f	11c8fe77-61a2-4761-b804-46106525f467	t
f6bf1733-7f4e-4e8d-bdb8-35fb3019e134	bc914e7f-4401-4448-aca9-9c058ae999b3	11c8fe77-61a2-4761-b804-46106525f467	t
6a5fc471-0a39-412e-b202-8e7c7a94ce0d	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	11c8fe77-61a2-4761-b804-46106525f467	t
4edbec0d-1da1-45b4-ab37-06acbf9b417d	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	11c8fe77-61a2-4761-b804-46106525f467	t
1f14a581-807f-43ca-89c8-d8b6332fc9e6	c0fbd9f3-9271-433c-9075-d96b25eba0e9	11c8fe77-61a2-4761-b804-46106525f467	t
77122097-ad00-48fc-a79d-c3dc0cc74fb0	ea9057ff-1aa1-4565-b084-f743a4a3d975	11c8fe77-61a2-4761-b804-46106525f467	t
bcf9ff83-a10b-4e56-a072-436d65f81a2e	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	11c8fe77-61a2-4761-b804-46106525f467	t
9910d7ef-d76d-45fe-9ad4-08d6be62a3a2	68c06cf9-d8e9-463d-93f7-360c8daa7683	11c8fe77-61a2-4761-b804-46106525f467	t
3b8fa958-3880-420c-9725-dbb0d47c7bd3	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	11c8fe77-61a2-4761-b804-46106525f467	t
aa3bf896-2787-4e04-bab6-f63703a18a71	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	11c8fe77-61a2-4761-b804-46106525f467	t
8bb9f9f8-a5ba-4c4f-be5b-c5fc5a45d105	ffe05eb5-ab28-467b-9e6a-e2a88887876b	11c8fe77-61a2-4761-b804-46106525f467	t
45a293c3-0439-49f4-a566-646fd5b2b303	cc6392ae-9095-409a-a453-b95fcfcc16f1	11c8fe77-61a2-4761-b804-46106525f467	t
6eb324e5-d22b-4935-ad05-0c030db4493e	999a870f-4b2a-4161-82d9-ba58c7a77fd2	11c8fe77-61a2-4761-b804-46106525f467	t
56f78721-220e-443d-b159-b5a12528d66b	6d204d7f-e985-4328-90ea-cebf86b9271b	11c8fe77-61a2-4761-b804-46106525f467	t
23ae2822-0101-489a-a801-f54329f34341	2896a379-554f-49a0-9969-a0c755ce4991	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
268fbfb4-18fa-487e-b94e-e995ff56c069	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
05f0e6df-22dd-4ae1-be02-adbf43c2facc	13846310-0456-481d-8791-66eac9f53c8f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
896f7c14-7ddd-4a18-a0ef-1bf6879bd839	aed3be59-7096-4d93-ba73-375f068ac05a	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
9973fa4c-5fb4-43b9-8065-8aeeac512862	fce4b9ae-c28f-43bb-ba90-abf2010a693b	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
7d96e2c1-de62-4342-ba3e-1ee6ed732e51	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
c031336e-1910-47e3-b859-a52ccae1235a	4db35518-a75a-427b-9f28-ada15be0f391	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
18bd4d40-c652-403a-b9e6-36e89ff30c8e	13c6c895-d834-42eb-8865-decc01d94e42	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
cf532fc1-4ec9-4a10-81b4-c484cce4b869	0af7012d-d1e2-447e-8903-19e4becd0d63	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
7965b2ad-a1cd-4c47-8e4f-2fe25387d50b	922f4bf3-4a24-49c1-ad57-b74a05a253ab	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
179d8c40-3af5-4845-bfd4-f5089a556684	6ac214f6-41cb-4be6-9765-df33bad3b63f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
40c36da8-a9bc-431b-9ad9-c251fc259a62	bc914e7f-4401-4448-aca9-9c058ae999b3	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
218dfc14-c616-4e77-bfad-b6500410d53f	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	f
fc76254c-678a-494d-b62a-cf930e12fbe9	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
c0af1f2b-3887-4824-9177-581802c36a05	c0fbd9f3-9271-433c-9075-d96b25eba0e9	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
f974d1af-ff22-4a5c-a7cf-ed71cda16b9a	ea9057ff-1aa1-4565-b084-f743a4a3d975	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
29d2678a-8e24-4ca6-9b71-394ae012eb7d	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
a87fc883-8cef-4e15-850d-847765304c83	68c06cf9-d8e9-463d-93f7-360c8daa7683	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
7bb62ec2-ec6a-40ef-add2-506cb773c14f	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
c1607139-b22e-46f8-9e7f-025ee7ce70d4	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
81527ca5-b8b3-452a-b0a7-5135e98f32b9	ffe05eb5-ab28-467b-9e6a-e2a88887876b	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
8a796fdc-3be3-4f2b-8009-fe28ee062a7f	cc6392ae-9095-409a-a453-b95fcfcc16f1	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
d13350b5-9f87-47c1-88be-04b23ea08ad8	999a870f-4b2a-4161-82d9-ba58c7a77fd2	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
f0af8c5d-07f2-4a05-8788-f9505fb8a5fa	6d204d7f-e985-4328-90ea-cebf86b9271b	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
2d091cfc-7b61-430d-a74e-084eb5dd5933	2896a379-554f-49a0-9969-a0c755ce4991	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
f5d1afb1-2790-47c9-bf00-ff96172ba94c	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
878122c4-c2b6-4ccc-8608-9cdbb48b8ac4	13846310-0456-481d-8791-66eac9f53c8f	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
6f44b703-8fa7-4aae-ba1e-c297fd092e1e	aed3be59-7096-4d93-ba73-375f068ac05a	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
63a3d0e2-3d4d-49ad-bd1c-91a8c2d97c37	fce4b9ae-c28f-43bb-ba90-abf2010a693b	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
e9f5fd01-e3ae-4208-b151-9d5cef716b3e	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
c5eb1959-d624-4ef6-a23a-05fabd013bfa	4db35518-a75a-427b-9f28-ada15be0f391	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
16b23869-cace-4e83-9c10-4b7d85167c18	13c6c895-d834-42eb-8865-decc01d94e42	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
e0b55aa3-f0bd-442b-ac7d-939a57e10d9f	0af7012d-d1e2-447e-8903-19e4becd0d63	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
a90a6fb9-5f1e-4acd-a408-f47185e908d1	922f4bf3-4a24-49c1-ad57-b74a05a253ab	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
e79c7a3a-e458-4fe1-a90e-0d55c16e38e2	6ac214f6-41cb-4be6-9765-df33bad3b63f	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
74353d03-893a-4ef4-bfed-ce606427388e	bc914e7f-4401-4448-aca9-9c058ae999b3	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
231197ee-7380-4c2a-b242-1c567cdd3f53	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
156ae763-ae38-4b0e-b6c1-ee418fd287d9	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
1404737d-87aa-4b7c-87a0-3519c4f4017c	c0fbd9f3-9271-433c-9075-d96b25eba0e9	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
74c354a3-b0ca-494d-b637-e33743ca9dd5	ea9057ff-1aa1-4565-b084-f743a4a3d975	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
a5679961-555d-40f0-997c-8bbcc8e6f695	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
ea0fe52e-5238-49a5-8a00-e24f990636d4	68c06cf9-d8e9-463d-93f7-360c8daa7683	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
80beb833-c643-4a95-9890-dfda674f1449	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
6ca7c9f4-afbc-4a4f-950d-d534f0360f50	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
c9570334-1b02-46cf-8d56-5bff6ac1746a	ffe05eb5-ab28-467b-9e6a-e2a88887876b	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
8af75dad-4bdc-42af-a401-041b7f92c627	cc6392ae-9095-409a-a453-b95fcfcc16f1	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
6c2e6894-f893-47f6-b415-9fdb101b6101	999a870f-4b2a-4161-82d9-ba58c7a77fd2	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
bba201ed-87c5-4865-bf59-b9da54ef25e3	6d204d7f-e985-4328-90ea-cebf86b9271b	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
061b1e23-38af-4c7b-be2b-41b77d3498f4	2896a379-554f-49a0-9969-a0c755ce4991	c827a01f-387c-4c59-bfcd-829297a30a74	t
02532c48-c528-4db7-bb27-cb5b7e8b333b	9c3112e3-de6e-4323-93ef-c61d1c4e6c10	c827a01f-387c-4c59-bfcd-829297a30a74	t
49fcf5e9-057e-4cab-9428-6a1defe90493	13846310-0456-481d-8791-66eac9f53c8f	c827a01f-387c-4c59-bfcd-829297a30a74	t
1b38929b-de3f-4b5f-8c97-da33c75d758d	aed3be59-7096-4d93-ba73-375f068ac05a	c827a01f-387c-4c59-bfcd-829297a30a74	t
b71a4c98-92b4-4c5a-84bb-005e75b87875	fce4b9ae-c28f-43bb-ba90-abf2010a693b	c827a01f-387c-4c59-bfcd-829297a30a74	t
d3376237-8ba1-49ea-8f81-50f058700448	e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	c827a01f-387c-4c59-bfcd-829297a30a74	t
21a69543-9d75-4b77-bc07-5512f847f827	4db35518-a75a-427b-9f28-ada15be0f391	c827a01f-387c-4c59-bfcd-829297a30a74	t
ae3cb222-283e-4909-9586-1bd629bd0718	13c6c895-d834-42eb-8865-decc01d94e42	c827a01f-387c-4c59-bfcd-829297a30a74	t
352792dc-ef9b-42de-9ca0-456f8f052189	0af7012d-d1e2-447e-8903-19e4becd0d63	c827a01f-387c-4c59-bfcd-829297a30a74	t
4cf25293-c91c-46a9-94f4-10b0d1772f1e	922f4bf3-4a24-49c1-ad57-b74a05a253ab	c827a01f-387c-4c59-bfcd-829297a30a74	t
f182b431-6006-4bce-b865-bf7c412471ac	6ac214f6-41cb-4be6-9765-df33bad3b63f	c827a01f-387c-4c59-bfcd-829297a30a74	t
ede6921b-0a06-4fad-9e2f-d5107667240e	bc914e7f-4401-4448-aca9-9c058ae999b3	c827a01f-387c-4c59-bfcd-829297a30a74	t
e9674544-e0da-4b4c-beb6-2ac9c67b3eeb	4cfb8cf3-47e0-4a4b-906a-360e31250dcd	c827a01f-387c-4c59-bfcd-829297a30a74	t
22909304-3737-4ab8-b0d6-1051cd05d051	6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	c827a01f-387c-4c59-bfcd-829297a30a74	t
72a6f5bf-4cce-4183-af63-5a5023fc9e49	c0fbd9f3-9271-433c-9075-d96b25eba0e9	c827a01f-387c-4c59-bfcd-829297a30a74	t
e334a9ae-769e-4710-a9f9-ec0c7dcad7ee	ea9057ff-1aa1-4565-b084-f743a4a3d975	c827a01f-387c-4c59-bfcd-829297a30a74	t
9afd5359-562c-4c68-a24a-40fc454271e1	d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	c827a01f-387c-4c59-bfcd-829297a30a74	t
96faf54f-0e03-4554-be56-52d51e73b844	68c06cf9-d8e9-463d-93f7-360c8daa7683	c827a01f-387c-4c59-bfcd-829297a30a74	t
0011c93e-bb7a-4a26-bd46-201be873eafe	9343db3a-1078-4fb4-a1be-4e212a7fb1ff	c827a01f-387c-4c59-bfcd-829297a30a74	t
9d51fb67-9bf3-41ae-a42f-7e7e41dd5bc7	8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	c827a01f-387c-4c59-bfcd-829297a30a74	t
a80c0ae8-9dcb-4452-91ba-957922885264	ffe05eb5-ab28-467b-9e6a-e2a88887876b	c827a01f-387c-4c59-bfcd-829297a30a74	t
c0004b0c-5384-4b26-8e82-ad90a196f550	cc6392ae-9095-409a-a453-b95fcfcc16f1	c827a01f-387c-4c59-bfcd-829297a30a74	t
ecaeaf08-2054-47b6-a5b6-b19521d84407	999a870f-4b2a-4161-82d9-ba58c7a77fd2	c827a01f-387c-4c59-bfcd-829297a30a74	t
1af085ea-41e4-47aa-9b4f-37f8a2a3389e	6d204d7f-e985-4328-90ea-cebf86b9271b	c827a01f-387c-4c59-bfcd-829297a30a74	t
f8b1d6eb-8415-4f39-a43f-c5400f809599	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
42b9ba01-9d06-4e0d-a62a-d35b0e16b053	25939211-bf7f-4658-95d5-40a0e6b562c1	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
c61c19a6-dbf7-468b-99ae-eb8ba914bc9c	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
f65ef659-a15a-47de-9a61-8e5ed02565d8	358ba0ad-51de-499d-9f0b-afebc303265f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
dbd02020-85e8-4c0c-93f2-688af47f2c7b	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
30cbea2f-ebe4-491b-9aa6-adcc0414977a	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
c1091a8d-7424-40de-bea7-befd739a8313	316f17a8-6650-4a15-ac63-584b710e85d3	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
a59c5dbc-6e03-4b86-b867-84d6f30757e1	452d708f-19a9-4295-ad7a-42826a21212f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
e7748c34-f101-4726-85f2-746407fa7a72	7e454624-36e5-4a0c-aeba-ecd50b76734f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
94db4c3b-798d-4d1c-b916-88b71847682a	a21c633e-8260-4e3a-9ac7-46a34da28827	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
e9972ff0-12a4-4de8-bc16-fff2ca07769d	a1195634-f79d-41db-9193-10c2e68dfece	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
9b908fcd-c514-41ed-8d07-e4ea94ccb464	ab9a418e-1e79-4fc4-877d-9c52baa03768	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
962cc146-c45f-469b-b00c-ba9922e24440	55e896ce-f843-4eed-aa1e-e937a7a5a84b	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
af487301-f5c6-4007-9252-bb16ec180706	e6647eb9-e85a-42d3-be5c-ff0536c215b8	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
c96b3f7d-8b7c-4406-980f-131aadd3f7b7	238a8ed1-5657-4fea-8221-85d2489b1d52	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
21642ab0-1dea-44c4-921d-3b6d3dde171a	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
2b85aba5-540e-46c3-b1c5-2d88376208f4	7b74136f-d26a-48a3-9896-4369f6040d65	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
83720d11-8e37-4235-80eb-5a15a076d9d4	42a1438a-1f58-4fb7-8085-46833848c9c3	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
fd39f941-46be-4751-8f47-b553cbb20c3d	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
aa53a872-5e7a-410d-b846-e5ee95fef334	598b3c2a-c143-44ea-9f3f-f1a180dd268b	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
6f0823e6-ed54-4e5d-8789-d26df71dcb2f	478dcb48-fda6-4d62-aafe-9e7c16013f65	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
61a6ef84-6a31-4e31-a7d7-290279b15a49	1a584474-6eb4-47e7-964f-ec7ef9340795	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
d6c0f4ff-d216-4953-af38-c341989175a1	d9048a89-cc5d-484c-b402-c9a4f63d829a	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
7a4d1082-e369-462b-b81b-2c70a6c2fa5d	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	ab8d6a3a-8889-442c-996e-15825a25e37f	f
956dbec4-c7b9-44ca-86e6-da4c52c0221b	25939211-bf7f-4658-95d5-40a0e6b562c1	ab8d6a3a-8889-442c-996e-15825a25e37f	t
23d1271f-96fb-455c-af45-4ba75537f83f	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	ab8d6a3a-8889-442c-996e-15825a25e37f	f
3686c32c-6d41-41af-8dfd-d618507323ac	358ba0ad-51de-499d-9f0b-afebc303265f	ab8d6a3a-8889-442c-996e-15825a25e37f	f
09c882b4-338a-4185-a725-e277771d8a72	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	ab8d6a3a-8889-442c-996e-15825a25e37f	f
9cde6d12-0f53-407b-ad69-580c782c34c1	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	ab8d6a3a-8889-442c-996e-15825a25e37f	t
5f683f27-9f08-4dd8-8045-a6f64aa2cb88	316f17a8-6650-4a15-ac63-584b710e85d3	ab8d6a3a-8889-442c-996e-15825a25e37f	f
3d1615d1-3252-4810-9e80-0387dc8a52b4	452d708f-19a9-4295-ad7a-42826a21212f	ab8d6a3a-8889-442c-996e-15825a25e37f	f
8866df59-f0ee-4f01-a918-66881389043b	7e454624-36e5-4a0c-aeba-ecd50b76734f	ab8d6a3a-8889-442c-996e-15825a25e37f	t
c5999990-4db8-47bd-8169-ab4d2145bbab	a21c633e-8260-4e3a-9ac7-46a34da28827	ab8d6a3a-8889-442c-996e-15825a25e37f	t
84c007d8-4882-4f6a-a633-d3ca50af4a7e	a1195634-f79d-41db-9193-10c2e68dfece	ab8d6a3a-8889-442c-996e-15825a25e37f	t
1df5be4d-b0c9-427e-934f-5f1b92638ad0	ab9a418e-1e79-4fc4-877d-9c52baa03768	ab8d6a3a-8889-442c-996e-15825a25e37f	t
05cfd5d8-593e-4cda-8162-4b45bd165c94	55e896ce-f843-4eed-aa1e-e937a7a5a84b	ab8d6a3a-8889-442c-996e-15825a25e37f	t
e877ff4b-7fcc-4882-9124-de6b46ae2be1	e6647eb9-e85a-42d3-be5c-ff0536c215b8	ab8d6a3a-8889-442c-996e-15825a25e37f	t
824ebd32-6abd-4416-ac69-816c79f1da23	238a8ed1-5657-4fea-8221-85d2489b1d52	ab8d6a3a-8889-442c-996e-15825a25e37f	t
12efb88c-1b4d-4d51-b7ed-b211ff0c25f9	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	ab8d6a3a-8889-442c-996e-15825a25e37f	t
1284a62d-32a3-4cfe-b5da-3bf183036f52	7b74136f-d26a-48a3-9896-4369f6040d65	ab8d6a3a-8889-442c-996e-15825a25e37f	t
f598ac86-eb63-4727-925c-6b7c645ce156	42a1438a-1f58-4fb7-8085-46833848c9c3	ab8d6a3a-8889-442c-996e-15825a25e37f	f
84cdceca-7547-465c-87d8-14d32b60abd7	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	ab8d6a3a-8889-442c-996e-15825a25e37f	t
6a65c12b-f72d-4c27-a1d7-1fabbca6fb54	598b3c2a-c143-44ea-9f3f-f1a180dd268b	ab8d6a3a-8889-442c-996e-15825a25e37f	t
65d2466d-028b-4eac-86c3-c3265cb0303a	478dcb48-fda6-4d62-aafe-9e7c16013f65	ab8d6a3a-8889-442c-996e-15825a25e37f	f
7249957a-9b59-483a-ac85-eb53490e2ab7	1a584474-6eb4-47e7-964f-ec7ef9340795	ab8d6a3a-8889-442c-996e-15825a25e37f	t
47c94a38-b232-45ef-b984-f4175128b6f2	d9048a89-cc5d-484c-b402-c9a4f63d829a	ab8d6a3a-8889-442c-996e-15825a25e37f	t
2b185263-b334-45cc-a80b-7784879267dc	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
a63dcfbe-127f-4eda-b524-1d4924a2bdff	25939211-bf7f-4658-95d5-40a0e6b562c1	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
1d33bd4a-4395-4d4f-8ec8-e3689bf3562f	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
ab1349c7-8009-4656-8e76-1b9e65aee231	358ba0ad-51de-499d-9f0b-afebc303265f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
294d2edf-acd3-4824-b121-fa3e2b32728f	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
1918d23a-ed6e-4c91-be84-e8cf234dcbd4	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
fb2688cb-f6f2-46d3-8564-a990421081bf	316f17a8-6650-4a15-ac63-584b710e85d3	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
f1252f1a-060f-40a8-acf6-5b009b5991cc	452d708f-19a9-4295-ad7a-42826a21212f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
2595a08d-e6d1-4048-bcd2-f1c5ef357420	7e454624-36e5-4a0c-aeba-ecd50b76734f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
7087db76-8f78-4cd7-bb04-ac2717b3f997	a21c633e-8260-4e3a-9ac7-46a34da28827	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
5237b6a6-2664-4586-b450-f5537d75a80a	a1195634-f79d-41db-9193-10c2e68dfece	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
6a9a182c-209e-4413-9d96-fa4e317728fd	ab9a418e-1e79-4fc4-877d-9c52baa03768	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
111c175d-aad3-4f60-bfcb-62d167f6704c	55e896ce-f843-4eed-aa1e-e937a7a5a84b	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
d15968d6-1fff-4b69-a03f-c54ae99f3e12	e6647eb9-e85a-42d3-be5c-ff0536c215b8	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
af68c19d-c4da-4b15-ae40-ad02664b1b84	238a8ed1-5657-4fea-8221-85d2489b1d52	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
bb4982ba-1daf-4eaf-ad99-dd35abbf9d52	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
bb5353aa-19fa-4b5c-96c9-54c005dfcce2	7b74136f-d26a-48a3-9896-4369f6040d65	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
5972ef8b-1f2d-4166-b765-9b9fe999a4be	42a1438a-1f58-4fb7-8085-46833848c9c3	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
a97fd724-8f59-4941-b3d6-d507602c0424	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
9d95108d-ba4f-485a-88ea-fa5623841e11	598b3c2a-c143-44ea-9f3f-f1a180dd268b	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
4acf62aa-9228-49e6-be52-921250d6f2bb	478dcb48-fda6-4d62-aafe-9e7c16013f65	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
a6479a09-5964-40f7-b13b-aac1466d2b4e	1a584474-6eb4-47e7-964f-ec7ef9340795	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
c63ab9ec-1265-4d2c-b072-8cf8ccf536c9	d9048a89-cc5d-484c-b402-c9a4f63d829a	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
b9327772-89e9-43a4-9c74-fd9a4ffa73c4	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	ae753320-c362-4d8b-8294-53533a1a5798	f
13d044a0-4515-4f31-b17e-a45a7ef8738d	25939211-bf7f-4658-95d5-40a0e6b562c1	ae753320-c362-4d8b-8294-53533a1a5798	t
b8762817-846d-4082-8318-d72a9cb86f3d	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	ae753320-c362-4d8b-8294-53533a1a5798	t
ea0864ed-3997-4578-87fd-667979130e12	358ba0ad-51de-499d-9f0b-afebc303265f	ae753320-c362-4d8b-8294-53533a1a5798	f
ade0cfc9-9ad6-4157-a571-2fc7673fd45c	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	ae753320-c362-4d8b-8294-53533a1a5798	t
2df3e7d1-368f-4e0d-9d03-47d56f2c9cd2	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	ae753320-c362-4d8b-8294-53533a1a5798	t
1904a130-38b4-4ee0-b2d3-9f8656bc88a6	316f17a8-6650-4a15-ac63-584b710e85d3	ae753320-c362-4d8b-8294-53533a1a5798	t
e8eb5296-38ab-4c96-9f98-162e6a043310	452d708f-19a9-4295-ad7a-42826a21212f	ae753320-c362-4d8b-8294-53533a1a5798	f
b70aca85-51e0-4ab8-b8e1-d157571ea9d5	7e454624-36e5-4a0c-aeba-ecd50b76734f	ae753320-c362-4d8b-8294-53533a1a5798	t
2e8064cc-4ec2-4c4b-b4b0-a9c9cae7450d	a21c633e-8260-4e3a-9ac7-46a34da28827	ae753320-c362-4d8b-8294-53533a1a5798	t
27eec8ad-0918-4c92-b55a-4d748a7c5aa4	a1195634-f79d-41db-9193-10c2e68dfece	ae753320-c362-4d8b-8294-53533a1a5798	t
464df2e5-33f2-4a54-bf5b-11f85e8c24ed	ab9a418e-1e79-4fc4-877d-9c52baa03768	ae753320-c362-4d8b-8294-53533a1a5798	f
7d92a870-4e72-422c-bd47-ecfa18c53e8a	55e896ce-f843-4eed-aa1e-e937a7a5a84b	ae753320-c362-4d8b-8294-53533a1a5798	t
617eb1b7-a79b-4454-9c88-5458194aec33	e6647eb9-e85a-42d3-be5c-ff0536c215b8	ae753320-c362-4d8b-8294-53533a1a5798	t
d26f167e-29cc-4146-b5e1-29b771132bb8	238a8ed1-5657-4fea-8221-85d2489b1d52	ae753320-c362-4d8b-8294-53533a1a5798	f
ea19a2f8-c3e5-4a32-abff-974234c6e3ef	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	ae753320-c362-4d8b-8294-53533a1a5798	f
9127b281-e3df-492d-b3a1-0fa809370d74	7b74136f-d26a-48a3-9896-4369f6040d65	ae753320-c362-4d8b-8294-53533a1a5798	f
31643746-85f0-4747-b3d1-187d4699b712	42a1438a-1f58-4fb7-8085-46833848c9c3	ae753320-c362-4d8b-8294-53533a1a5798	f
dd46c5ba-d04d-4728-8dae-187015809096	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	ae753320-c362-4d8b-8294-53533a1a5798	t
05731b5c-728d-42ad-ba06-2101a4f68a4c	598b3c2a-c143-44ea-9f3f-f1a180dd268b	ae753320-c362-4d8b-8294-53533a1a5798	t
ad6f4346-a9e0-4ab0-b613-d98e3973f6e6	478dcb48-fda6-4d62-aafe-9e7c16013f65	ae753320-c362-4d8b-8294-53533a1a5798	t
6c9ca79f-3ebe-414e-bfd0-67949ea0a8f9	1a584474-6eb4-47e7-964f-ec7ef9340795	ae753320-c362-4d8b-8294-53533a1a5798	t
3cab7a44-6c7d-4897-8338-9d3a56e64e47	d9048a89-cc5d-484c-b402-c9a4f63d829a	ae753320-c362-4d8b-8294-53533a1a5798	t
c033e677-0600-47cf-97eb-a9bb364e2012	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
0d4d7ef7-e814-4fed-9714-6455c6a4a6c6	25939211-bf7f-4658-95d5-40a0e6b562c1	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
3a3e103c-fd5b-4bc5-bdb4-46ada72c63e6	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
a422b696-474e-4fd9-9ffb-904800543fa8	358ba0ad-51de-499d-9f0b-afebc303265f	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
2d8868ed-6645-44a9-aede-40856be22d88	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
fe011aec-bb63-404e-982c-fb614a8d1286	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
5e38a9d2-c25f-4823-8dab-e47d602687ef	316f17a8-6650-4a15-ac63-584b710e85d3	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
28494bd1-f099-4977-bdea-35067a4ef719	452d708f-19a9-4295-ad7a-42826a21212f	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
f6a2e930-3484-48aa-9063-9b128ccae3ff	7e454624-36e5-4a0c-aeba-ecd50b76734f	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
45857ca4-246c-4f52-83e4-a602a5940e6a	a21c633e-8260-4e3a-9ac7-46a34da28827	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
eb7dce14-15ae-4b86-9f3f-4a04ecf06a0e	a1195634-f79d-41db-9193-10c2e68dfece	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
4947c432-ef28-40e6-b8ba-fb7fb1d22ab7	ab9a418e-1e79-4fc4-877d-9c52baa03768	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
77e987d4-e8be-4077-a386-ddbf382805d0	55e896ce-f843-4eed-aa1e-e937a7a5a84b	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
60561663-403c-4a74-91e7-8bf95dc1f32c	e6647eb9-e85a-42d3-be5c-ff0536c215b8	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
6fd74949-7443-4c58-802c-533585c2a807	238a8ed1-5657-4fea-8221-85d2489b1d52	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
3e940eb8-c3fd-4034-8990-5bc39c59aee2	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
44b12d7c-af5c-4dab-a576-57d9711e17e6	7b74136f-d26a-48a3-9896-4369f6040d65	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
9b1a1367-c836-4f63-87d5-959b2edb4449	42a1438a-1f58-4fb7-8085-46833848c9c3	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
488ac8b2-fa13-49f0-9811-5ae38dd90560	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
e54c1eb6-efad-4c0a-98ff-0a72c6c12584	598b3c2a-c143-44ea-9f3f-f1a180dd268b	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
e4ff62bc-cea5-4f3a-b6e2-ac48d37bdb9a	478dcb48-fda6-4d62-aafe-9e7c16013f65	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
125ae66d-946d-4cc0-90e5-87531f147b79	1a584474-6eb4-47e7-964f-ec7ef9340795	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
92d8dd3a-8511-4828-b289-96c61a1a13ac	d9048a89-cc5d-484c-b402-c9a4f63d829a	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
541c9be1-399e-4489-a632-ffcdde5dfda1	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
27e61690-eaf8-4298-98bc-563293f7de6b	25939211-bf7f-4658-95d5-40a0e6b562c1	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
7b703e49-8279-46b6-888b-e215ffe08997	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
0ea90a03-8800-435d-bbe6-a320c1b3dacd	358ba0ad-51de-499d-9f0b-afebc303265f	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
d49bd5b5-bc02-4d53-8283-3845c40704cc	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
67e3036f-e3d7-4385-a315-d8478840b7bb	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
24771a20-2581-4867-863e-ccc726217434	316f17a8-6650-4a15-ac63-584b710e85d3	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
a2dc2c93-6987-458e-945c-2f30e0d19e7b	452d708f-19a9-4295-ad7a-42826a21212f	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
5b572eb1-d320-41ec-92ca-8319f6713221	7e454624-36e5-4a0c-aeba-ecd50b76734f	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
c3763392-f978-44a9-a7ee-5fa512337192	a21c633e-8260-4e3a-9ac7-46a34da28827	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
27c7b21a-c6af-4ef6-ba05-03380febc5a1	a1195634-f79d-41db-9193-10c2e68dfece	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
399317c7-0416-4c83-9be2-79028facb77d	ab9a418e-1e79-4fc4-877d-9c52baa03768	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
53abd244-8615-46b7-97c7-00ddaa70a0b5	55e896ce-f843-4eed-aa1e-e937a7a5a84b	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
020ede2b-46b6-4ac2-9724-80456d044382	e6647eb9-e85a-42d3-be5c-ff0536c215b8	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
4898e658-455f-418a-a960-54245279ae68	238a8ed1-5657-4fea-8221-85d2489b1d52	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
8637aad8-8054-4513-b95d-b2947c202810	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
24813595-f9f2-47d0-848a-f3113abbc2e6	7b74136f-d26a-48a3-9896-4369f6040d65	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
4083fa93-99ea-4c56-be3e-55dcb1d1223f	42a1438a-1f58-4fb7-8085-46833848c9c3	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
a48958b0-5cb1-4050-b1de-50cbb3cadcdd	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
c5a16901-6257-4d5c-926a-aef33f9c8b0d	598b3c2a-c143-44ea-9f3f-f1a180dd268b	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
d1036a3b-3fea-487d-af03-475220007d80	478dcb48-fda6-4d62-aafe-9e7c16013f65	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
f742c750-cde1-4e13-b512-676fddcb3876	1a584474-6eb4-47e7-964f-ec7ef9340795	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
9058b62f-ae39-47ae-a256-7c11d44eedcb	d9048a89-cc5d-484c-b402-c9a4f63d829a	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
c0afb1cf-3619-4324-9884-18c0188f889f	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	65ef7119-ea28-4a7a-9329-fcef962e4343	f
526416dd-4be8-4981-b803-84f0c4d17a0b	25939211-bf7f-4658-95d5-40a0e6b562c1	65ef7119-ea28-4a7a-9329-fcef962e4343	t
97d102f7-c114-45d0-8de6-5a3f1ee7811b	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	65ef7119-ea28-4a7a-9329-fcef962e4343	t
0932d822-b385-4a72-806a-c842f4c267dc	358ba0ad-51de-499d-9f0b-afebc303265f	65ef7119-ea28-4a7a-9329-fcef962e4343	t
d8a335ff-9cbc-4c92-89ad-1b2f5e53e79a	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	65ef7119-ea28-4a7a-9329-fcef962e4343	t
37f2ab66-2548-47dc-b414-e4512a7c01ae	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	65ef7119-ea28-4a7a-9329-fcef962e4343	t
960db4e9-03f4-40bb-b31f-42d5eab9a04f	316f17a8-6650-4a15-ac63-584b710e85d3	65ef7119-ea28-4a7a-9329-fcef962e4343	t
c56f364d-2111-49cc-8925-0ff7f22f76e4	452d708f-19a9-4295-ad7a-42826a21212f	65ef7119-ea28-4a7a-9329-fcef962e4343	f
8d8f9a48-413b-457c-8c6f-9d50b3e1b345	7e454624-36e5-4a0c-aeba-ecd50b76734f	65ef7119-ea28-4a7a-9329-fcef962e4343	t
c4281451-32c8-4777-9925-5c7fe155d553	a21c633e-8260-4e3a-9ac7-46a34da28827	65ef7119-ea28-4a7a-9329-fcef962e4343	f
43c5e8e1-5580-43df-b9ea-dc1d13c24e4c	a1195634-f79d-41db-9193-10c2e68dfece	65ef7119-ea28-4a7a-9329-fcef962e4343	t
79cc2877-1c38-4c52-913c-48d175961813	ab9a418e-1e79-4fc4-877d-9c52baa03768	65ef7119-ea28-4a7a-9329-fcef962e4343	t
76c7d0a8-73f6-4c07-afbb-d8ba51af9d2b	55e896ce-f843-4eed-aa1e-e937a7a5a84b	65ef7119-ea28-4a7a-9329-fcef962e4343	t
236efea1-3094-4b8c-9a11-ff29e16ff692	e6647eb9-e85a-42d3-be5c-ff0536c215b8	65ef7119-ea28-4a7a-9329-fcef962e4343	f
34c74202-5dac-4299-9122-48480e3db2e1	238a8ed1-5657-4fea-8221-85d2489b1d52	65ef7119-ea28-4a7a-9329-fcef962e4343	t
f5e9e0cf-de77-4eb3-a32b-f7bd409602fd	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	65ef7119-ea28-4a7a-9329-fcef962e4343	f
8389740b-4961-43df-9b65-895b5fbd2a13	7b74136f-d26a-48a3-9896-4369f6040d65	65ef7119-ea28-4a7a-9329-fcef962e4343	f
a25ba9b7-c16d-4ceb-ba99-e1767f85e31e	42a1438a-1f58-4fb7-8085-46833848c9c3	65ef7119-ea28-4a7a-9329-fcef962e4343	f
d327c4f3-c07f-41d2-b742-7affcceb7b6a	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	65ef7119-ea28-4a7a-9329-fcef962e4343	f
4c032649-f438-463d-a93c-945c70bec749	598b3c2a-c143-44ea-9f3f-f1a180dd268b	65ef7119-ea28-4a7a-9329-fcef962e4343	f
b50bfb12-3aef-480f-9459-ca6098f24035	478dcb48-fda6-4d62-aafe-9e7c16013f65	65ef7119-ea28-4a7a-9329-fcef962e4343	t
63b29d13-83bd-45a5-8446-738b9a32dde2	1a584474-6eb4-47e7-964f-ec7ef9340795	65ef7119-ea28-4a7a-9329-fcef962e4343	t
815f885a-5953-4ca4-8d80-2fb2ff2cd25a	d9048a89-cc5d-484c-b402-c9a4f63d829a	65ef7119-ea28-4a7a-9329-fcef962e4343	t
98f6d583-f2ef-4f19-83ee-67e4b0231389	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	c1c97976-38c1-4174-b028-57b0273c7fac	f
7f3a8881-d81c-425d-9020-c079f0bd7ea9	25939211-bf7f-4658-95d5-40a0e6b562c1	c1c97976-38c1-4174-b028-57b0273c7fac	t
ce6a9b44-1912-4e04-8be8-6ec26dbfd64c	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	c1c97976-38c1-4174-b028-57b0273c7fac	f
b80a06ce-022e-4cd9-903a-461f348d73cf	358ba0ad-51de-499d-9f0b-afebc303265f	c1c97976-38c1-4174-b028-57b0273c7fac	t
330459c6-2fc3-4615-b123-4b2d3c301f5b	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	c1c97976-38c1-4174-b028-57b0273c7fac	f
91955761-fe7d-40b6-813c-c19524e4459c	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	c1c97976-38c1-4174-b028-57b0273c7fac	t
1cd81a0c-4f9f-4168-8b61-766cfa742b43	316f17a8-6650-4a15-ac63-584b710e85d3	c1c97976-38c1-4174-b028-57b0273c7fac	t
a5dbfc44-e939-484e-bf30-4b5e5ad2589e	452d708f-19a9-4295-ad7a-42826a21212f	c1c97976-38c1-4174-b028-57b0273c7fac	f
ad9dad1f-c9e9-4880-9ed7-c8dd111c0271	7e454624-36e5-4a0c-aeba-ecd50b76734f	c1c97976-38c1-4174-b028-57b0273c7fac	t
37e3788a-e48e-4a5a-b2b7-77876df143ae	a21c633e-8260-4e3a-9ac7-46a34da28827	c1c97976-38c1-4174-b028-57b0273c7fac	t
56ccdcef-9a04-4a6e-86b5-0dfb5fb34d86	a1195634-f79d-41db-9193-10c2e68dfece	c1c97976-38c1-4174-b028-57b0273c7fac	t
13bf7c6c-afb1-41af-95f4-73f619ef7eff	ab9a418e-1e79-4fc4-877d-9c52baa03768	c1c97976-38c1-4174-b028-57b0273c7fac	t
d5d84777-194e-49cd-a4d2-06c48cb6fb5e	55e896ce-f843-4eed-aa1e-e937a7a5a84b	c1c97976-38c1-4174-b028-57b0273c7fac	f
62428d6c-a6a7-49fd-a8ba-557033a1d14f	e6647eb9-e85a-42d3-be5c-ff0536c215b8	c1c97976-38c1-4174-b028-57b0273c7fac	f
a5565ede-f949-4275-988c-4a7f57192309	238a8ed1-5657-4fea-8221-85d2489b1d52	c1c97976-38c1-4174-b028-57b0273c7fac	t
e3d261f7-ea7d-4986-ad52-33374e0f2652	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	c1c97976-38c1-4174-b028-57b0273c7fac	f
0bbe40d7-c8ac-4cbf-9419-027f974ef637	7b74136f-d26a-48a3-9896-4369f6040d65	c1c97976-38c1-4174-b028-57b0273c7fac	f
79193afe-42b2-4236-976b-32b4a2008710	42a1438a-1f58-4fb7-8085-46833848c9c3	c1c97976-38c1-4174-b028-57b0273c7fac	f
35d06b3c-e61a-4c3c-8224-aa9e01800d8c	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	c1c97976-38c1-4174-b028-57b0273c7fac	f
1b1ce081-27f4-4f5b-8c9f-b691bc2c0e1a	598b3c2a-c143-44ea-9f3f-f1a180dd268b	c1c97976-38c1-4174-b028-57b0273c7fac	t
c0ef9d6c-14ae-4897-b502-55a10699f53c	478dcb48-fda6-4d62-aafe-9e7c16013f65	c1c97976-38c1-4174-b028-57b0273c7fac	f
f58ce785-f0e9-4285-ad1c-c6fc6481a72e	1a584474-6eb4-47e7-964f-ec7ef9340795	c1c97976-38c1-4174-b028-57b0273c7fac	t
e78cbc7a-9020-460b-9c6c-07e1b34e5892	d9048a89-cc5d-484c-b402-c9a4f63d829a	c1c97976-38c1-4174-b028-57b0273c7fac	t
97dea85e-ba11-4717-a1c0-d8d049683260	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
20c31e4c-47ea-42e4-a66c-06f232df7046	25939211-bf7f-4658-95d5-40a0e6b562c1	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
42bb3857-cdbe-41ca-b6f1-640e4dba38da	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
33480c50-66bd-4753-8e01-f1c57eb261f5	358ba0ad-51de-499d-9f0b-afebc303265f	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
8cc935d9-a4ff-4d85-bf70-871813ac207e	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
48bbe185-260e-4536-86e3-cd3739bb6cf2	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
08f21594-1740-4df8-816e-4ab5166a86c0	316f17a8-6650-4a15-ac63-584b710e85d3	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
2c060b77-0095-4de0-935f-fa78d2805e64	452d708f-19a9-4295-ad7a-42826a21212f	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
b6e63e63-d27d-46ed-a71e-730133543d0e	7e454624-36e5-4a0c-aeba-ecd50b76734f	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
4c10a9fd-6b6c-4669-adbd-f3abd49b6daf	a21c633e-8260-4e3a-9ac7-46a34da28827	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
7241f201-3472-40b9-a33d-974abc718b6b	a1195634-f79d-41db-9193-10c2e68dfece	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
a597f9d3-9ed9-4177-b162-6a5c713937d0	ab9a418e-1e79-4fc4-877d-9c52baa03768	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
5f9d65bd-6f12-4b6d-a756-d884f8a98176	55e896ce-f843-4eed-aa1e-e937a7a5a84b	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
a748b2b0-28db-4c54-8f26-3f3e85959b4f	e6647eb9-e85a-42d3-be5c-ff0536c215b8	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
b1187265-71a3-4a4e-b9dc-4270de3f8f18	238a8ed1-5657-4fea-8221-85d2489b1d52	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
545fce3a-2675-4946-9e43-b36ea6d98fd7	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
47d1b12b-f5ec-4384-831b-0777dc007dc7	7b74136f-d26a-48a3-9896-4369f6040d65	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
c4a27232-816a-4541-b3fe-83401df81b19	42a1438a-1f58-4fb7-8085-46833848c9c3	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
7858fd22-d1dd-4352-9f6c-789bd74d11ec	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
0f9f3778-c581-48f5-a739-53f4d6438057	598b3c2a-c143-44ea-9f3f-f1a180dd268b	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
a4f8c5e7-791e-497c-8302-3545f9c4ac22	478dcb48-fda6-4d62-aafe-9e7c16013f65	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
cde951c9-71dd-4194-8b70-6605552a2170	1a584474-6eb4-47e7-964f-ec7ef9340795	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
ad9e8ce4-e33c-4565-a0d7-82092559e585	d9048a89-cc5d-484c-b402-c9a4f63d829a	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
9e10569a-c71c-425e-89eb-51a7eb0826d1	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
fcb32332-fc6c-4055-8390-ebce05e04de3	25939211-bf7f-4658-95d5-40a0e6b562c1	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
151a446f-1124-4b2a-9492-52ab4e600b31	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
9b9fabab-7768-4ce5-aaac-8c5b5cfe3a43	358ba0ad-51de-499d-9f0b-afebc303265f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
053cf6c3-f297-42b9-b9a8-d5bfffea62c7	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
3c5c63b1-af81-4279-81a1-464f475695f3	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
fc662798-f857-4697-9fc2-05fee76e2bd9	316f17a8-6650-4a15-ac63-584b710e85d3	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
109cbf31-345a-458e-b5b8-b6ad6a6e7247	452d708f-19a9-4295-ad7a-42826a21212f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
ac93d6b1-8171-4943-a0d8-98ab15eae006	7e454624-36e5-4a0c-aeba-ecd50b76734f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
e2c6282f-feb0-4fea-b820-21281efb0205	a21c633e-8260-4e3a-9ac7-46a34da28827	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
723a6e0a-812b-4e5b-8b87-6fdd12e51985	a1195634-f79d-41db-9193-10c2e68dfece	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
6f213c85-d5fd-4aea-8c58-cbf2c38eb561	ab9a418e-1e79-4fc4-877d-9c52baa03768	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
79bd6bf9-4d4c-425c-864c-b06e1d008643	55e896ce-f843-4eed-aa1e-e937a7a5a84b	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
e6168afb-61fe-4baf-9123-8fe58c011438	e6647eb9-e85a-42d3-be5c-ff0536c215b8	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
5a0ab02b-eafe-4f2b-9a06-6b65e8ff00aa	238a8ed1-5657-4fea-8221-85d2489b1d52	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
5dc35e8f-469a-441d-b0cb-1aa292e7604f	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
5ab0bfca-044d-4f9b-b700-59c605d3d476	7b74136f-d26a-48a3-9896-4369f6040d65	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
2a3d0996-b0f1-455a-97b7-d654626f09c7	42a1438a-1f58-4fb7-8085-46833848c9c3	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
0013fcbb-162d-4371-b405-1eb87f58ab63	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
8018d245-ce95-40c4-a999-ed5dc18f0bf3	598b3c2a-c143-44ea-9f3f-f1a180dd268b	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
715eb729-e376-4181-80ea-94d21ff27335	478dcb48-fda6-4d62-aafe-9e7c16013f65	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
e3d78b77-ca6c-4d95-b328-f5ef8b06437d	1a584474-6eb4-47e7-964f-ec7ef9340795	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
208e924c-0744-4cd5-8b1a-1293414280c8	d9048a89-cc5d-484c-b402-c9a4f63d829a	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
61f14a6e-cbd5-4162-a36a-02e896eae0e6	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	95465124-34e6-4104-95f7-2f6289016331	f
9bbb3f22-e503-466d-abfd-b94bfc1b33a9	25939211-bf7f-4658-95d5-40a0e6b562c1	95465124-34e6-4104-95f7-2f6289016331	t
0cc5fb07-c901-4e87-9c56-005c43e72f86	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	95465124-34e6-4104-95f7-2f6289016331	t
0aa34511-260a-44ea-8038-8d8b1c956cbc	358ba0ad-51de-499d-9f0b-afebc303265f	95465124-34e6-4104-95f7-2f6289016331	t
5cff45e4-b7b1-4fdb-a769-8a06db684727	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	95465124-34e6-4104-95f7-2f6289016331	t
7c2b682b-f7f7-470a-9340-2afe3314406d	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	95465124-34e6-4104-95f7-2f6289016331	t
20388c0b-f339-43b4-ab3a-7a4140e76d74	316f17a8-6650-4a15-ac63-584b710e85d3	95465124-34e6-4104-95f7-2f6289016331	t
d4df1ef1-aeab-423d-98f5-f45bbcc9dd3b	452d708f-19a9-4295-ad7a-42826a21212f	95465124-34e6-4104-95f7-2f6289016331	t
087213ad-8a97-4f25-9361-5cd7f69c8614	7e454624-36e5-4a0c-aeba-ecd50b76734f	95465124-34e6-4104-95f7-2f6289016331	t
14e0ae4d-61cc-4096-a3d2-63c8ea979f5c	a21c633e-8260-4e3a-9ac7-46a34da28827	95465124-34e6-4104-95f7-2f6289016331	t
34b15ae8-3605-4e22-8219-66b2204d488f	a1195634-f79d-41db-9193-10c2e68dfece	95465124-34e6-4104-95f7-2f6289016331	t
4350d71a-bea5-4620-ad25-1ca3bb757973	ab9a418e-1e79-4fc4-877d-9c52baa03768	95465124-34e6-4104-95f7-2f6289016331	t
8844a9ef-6292-45ea-8923-1e987de8a5bd	55e896ce-f843-4eed-aa1e-e937a7a5a84b	95465124-34e6-4104-95f7-2f6289016331	t
9cb79b30-3bae-4f06-b1d2-05c0e993e3b1	e6647eb9-e85a-42d3-be5c-ff0536c215b8	95465124-34e6-4104-95f7-2f6289016331	t
ad17bc2b-15a1-469d-b4e6-0a9b959bd014	238a8ed1-5657-4fea-8221-85d2489b1d52	95465124-34e6-4104-95f7-2f6289016331	f
722130c6-6e79-47ee-be99-2f48435d98b0	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	95465124-34e6-4104-95f7-2f6289016331	f
f9a31538-38b0-498d-a62b-7f91cbdc1b85	7b74136f-d26a-48a3-9896-4369f6040d65	95465124-34e6-4104-95f7-2f6289016331	t
6f763430-b236-4e7f-a7c3-dc9f5a2b91d0	42a1438a-1f58-4fb7-8085-46833848c9c3	95465124-34e6-4104-95f7-2f6289016331	t
0c1d2ca8-9477-4b99-846b-187cab0b82f0	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	95465124-34e6-4104-95f7-2f6289016331	t
45526171-ab12-4e34-a5e2-2b06f0e6894f	598b3c2a-c143-44ea-9f3f-f1a180dd268b	95465124-34e6-4104-95f7-2f6289016331	f
5246b1b6-4db5-4c10-993f-4760bcccae03	478dcb48-fda6-4d62-aafe-9e7c16013f65	95465124-34e6-4104-95f7-2f6289016331	f
2441d651-6489-473b-984a-ccc16f64d3a5	1a584474-6eb4-47e7-964f-ec7ef9340795	95465124-34e6-4104-95f7-2f6289016331	t
9f25ada5-7210-4fd0-9920-d31420b938fb	d9048a89-cc5d-484c-b402-c9a4f63d829a	95465124-34e6-4104-95f7-2f6289016331	t
21d47cf2-1a4a-4d64-b79e-3bad4cf8f024	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
f5703edb-71d4-45a6-a08c-604155f55721	25939211-bf7f-4658-95d5-40a0e6b562c1	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
915a4d8e-5925-4a2e-8093-a7cf3d334239	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
c681b058-ffd6-4b0b-98e0-8b4731da7a5f	358ba0ad-51de-499d-9f0b-afebc303265f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
fd2e6c65-bf8f-44e1-8b96-ee0acf5a4f6e	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
36a19591-1a84-40da-b1a8-d30637bd7bff	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
fa51834d-010a-41b4-b348-191cedb3a79f	316f17a8-6650-4a15-ac63-584b710e85d3	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
e7ba4e22-f727-4e4c-9f4b-359971eb9d10	452d708f-19a9-4295-ad7a-42826a21212f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
94c751a6-5540-470a-879b-8a1e33e3dacd	7e454624-36e5-4a0c-aeba-ecd50b76734f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
c4f30524-1c17-4001-a8dd-e3166d9249af	a21c633e-8260-4e3a-9ac7-46a34da28827	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
5f43b840-0c6a-431c-be0b-1e70c76e7853	a1195634-f79d-41db-9193-10c2e68dfece	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
319e50c3-fa25-4082-a5ce-c013a8266fd4	ab9a418e-1e79-4fc4-877d-9c52baa03768	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
6db89ace-370e-4443-97da-df3bafd78702	55e896ce-f843-4eed-aa1e-e937a7a5a84b	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
cca23dfd-0c85-4a30-87af-375889ac21bc	e6647eb9-e85a-42d3-be5c-ff0536c215b8	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
ae76b1e3-7f52-4e31-99d1-f20b00363c3a	238a8ed1-5657-4fea-8221-85d2489b1d52	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
8dfa252f-8a8f-44a3-a4fd-6d9af7d4c85e	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
c778896d-3998-40f1-af5e-80424a7327c4	7b74136f-d26a-48a3-9896-4369f6040d65	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
7cdda976-ca71-4603-9144-335d9f13f121	42a1438a-1f58-4fb7-8085-46833848c9c3	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
63211e95-4996-413e-b8fc-59ed579d98bd	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
894c6762-0cf9-4f2e-9d9e-df3769327b2f	598b3c2a-c143-44ea-9f3f-f1a180dd268b	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
3ec52c3d-aa0f-473e-b1e6-598b54976d2b	478dcb48-fda6-4d62-aafe-9e7c16013f65	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
1b2278a1-ce50-4d70-bf9a-f8b92511dad2	1a584474-6eb4-47e7-964f-ec7ef9340795	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
3e0ea8bb-d333-42cc-b897-b37d2a122e16	d9048a89-cc5d-484c-b402-c9a4f63d829a	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
c07bd288-7b66-4e5c-96dd-8bcc3955cc84	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
aefd9fb2-3d7b-4f1f-bf4a-07845b7a72aa	25939211-bf7f-4658-95d5-40a0e6b562c1	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
81d244cd-dfea-4dbb-95d5-a6431ab1293b	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
e492aa80-8f36-4bcf-8c2d-a0be08100da9	358ba0ad-51de-499d-9f0b-afebc303265f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
6ef9b06a-d0f0-4cdd-a90a-16696a7b8437	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
61acc6c1-ecbc-4d3a-a288-0d696c58a91e	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
c3a415bd-a380-4d5d-be73-3307f49392c5	316f17a8-6650-4a15-ac63-584b710e85d3	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
98eb026f-4a0d-49d2-a173-b1aa577bd8eb	452d708f-19a9-4295-ad7a-42826a21212f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
f8793240-d432-4326-bf0f-533ce82ca619	7e454624-36e5-4a0c-aeba-ecd50b76734f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
6a6723cc-3b52-4455-aad9-256454011e53	a21c633e-8260-4e3a-9ac7-46a34da28827	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
fa00d5e7-ba50-4aa6-a0e9-027c37d662b7	a1195634-f79d-41db-9193-10c2e68dfece	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
6efcebc5-f339-44e9-b602-53b07dce0d19	ab9a418e-1e79-4fc4-877d-9c52baa03768	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
80db32bb-ed0c-4d30-ad13-92821f5f28d1	55e896ce-f843-4eed-aa1e-e937a7a5a84b	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
d9a72314-97c4-47dd-975d-3a3965b7150a	e6647eb9-e85a-42d3-be5c-ff0536c215b8	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
a6fc13bd-dce8-49b1-947c-7e1e150c1a81	238a8ed1-5657-4fea-8221-85d2489b1d52	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
9160d504-b49e-4984-adc0-31d851b58675	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
08d19da9-bf2e-4aa7-8bbf-37708196ed9f	7b74136f-d26a-48a3-9896-4369f6040d65	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
b18d513e-dd33-45a4-9f38-7c55348da8e0	42a1438a-1f58-4fb7-8085-46833848c9c3	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
d7126425-bcde-454e-ad24-0eab59d325bd	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
de87d1ee-6ae2-4e8e-88a4-72c282f67084	598b3c2a-c143-44ea-9f3f-f1a180dd268b	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
b5294396-39c6-42bb-883f-9122ce04df3a	478dcb48-fda6-4d62-aafe-9e7c16013f65	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
dd13bacc-378b-4efd-9669-bd20b9000dc9	1a584474-6eb4-47e7-964f-ec7ef9340795	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
5d7ecf2a-392d-4761-94db-cdfd6ed85bc7	d9048a89-cc5d-484c-b402-c9a4f63d829a	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
e79ec562-31fa-483a-bf94-88232b8b7439	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	a78272dc-151f-400f-a0b4-1eeec317739c	t
83f1feda-0d42-47ba-a128-362ee01362f4	25939211-bf7f-4658-95d5-40a0e6b562c1	a78272dc-151f-400f-a0b4-1eeec317739c	f
881c6442-a9e6-4839-a542-fd15b31c8fca	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	a78272dc-151f-400f-a0b4-1eeec317739c	f
d5869957-5ffa-4ec7-b486-97b66bd08e66	358ba0ad-51de-499d-9f0b-afebc303265f	a78272dc-151f-400f-a0b4-1eeec317739c	f
75386f7d-198d-4b7f-8248-d3fb1314d1bd	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	a78272dc-151f-400f-a0b4-1eeec317739c	f
697bd91d-ddf6-4d74-af96-48a19f65edc7	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	a78272dc-151f-400f-a0b4-1eeec317739c	f
664fb1fa-a50a-4bcd-8556-99823cc0b82e	316f17a8-6650-4a15-ac63-584b710e85d3	a78272dc-151f-400f-a0b4-1eeec317739c	f
eabb170a-8047-4a83-9d22-1cc1896156ca	452d708f-19a9-4295-ad7a-42826a21212f	a78272dc-151f-400f-a0b4-1eeec317739c	f
90b919d8-af5a-439f-bfdc-26859e1d52fa	7e454624-36e5-4a0c-aeba-ecd50b76734f	a78272dc-151f-400f-a0b4-1eeec317739c	t
cf368b7f-48bd-4135-a869-faa3433f98fd	a21c633e-8260-4e3a-9ac7-46a34da28827	a78272dc-151f-400f-a0b4-1eeec317739c	t
c0b0c34b-b2ae-4be9-b7bc-c745ce52ebf2	a1195634-f79d-41db-9193-10c2e68dfece	a78272dc-151f-400f-a0b4-1eeec317739c	t
9395fd8c-ea4b-43c0-a5a7-f4eb533c913d	ab9a418e-1e79-4fc4-877d-9c52baa03768	a78272dc-151f-400f-a0b4-1eeec317739c	t
7b90aafd-c5f7-4ad8-86e7-cd77c4c6085a	55e896ce-f843-4eed-aa1e-e937a7a5a84b	a78272dc-151f-400f-a0b4-1eeec317739c	t
ad25fb66-a485-4b98-8087-922708175483	e6647eb9-e85a-42d3-be5c-ff0536c215b8	a78272dc-151f-400f-a0b4-1eeec317739c	t
1ac6cf07-4825-4fed-83f3-40fa46254376	238a8ed1-5657-4fea-8221-85d2489b1d52	a78272dc-151f-400f-a0b4-1eeec317739c	t
f0c82b2a-49fc-4be6-b816-e6c80c7bb120	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	a78272dc-151f-400f-a0b4-1eeec317739c	t
ffa55cb4-9ae6-4fb3-85eb-0b0459277ec6	7b74136f-d26a-48a3-9896-4369f6040d65	a78272dc-151f-400f-a0b4-1eeec317739c	t
c646515a-2ebe-41d2-a44f-47bb17b94f02	42a1438a-1f58-4fb7-8085-46833848c9c3	a78272dc-151f-400f-a0b4-1eeec317739c	t
389b197d-717d-4557-ba27-3ec7da7e1507	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	a78272dc-151f-400f-a0b4-1eeec317739c	t
57ba5eb0-4bb5-4824-84b7-f328b307ccac	598b3c2a-c143-44ea-9f3f-f1a180dd268b	a78272dc-151f-400f-a0b4-1eeec317739c	t
db3df9cd-1f28-456f-b4ef-6c9c51995072	478dcb48-fda6-4d62-aafe-9e7c16013f65	a78272dc-151f-400f-a0b4-1eeec317739c	t
b2e86f06-012c-4515-b491-bed93f79e8cd	1a584474-6eb4-47e7-964f-ec7ef9340795	a78272dc-151f-400f-a0b4-1eeec317739c	t
c0441a69-8a5d-4f47-8d9e-ffbfc937509c	d9048a89-cc5d-484c-b402-c9a4f63d829a	a78272dc-151f-400f-a0b4-1eeec317739c	t
42754364-3b24-439f-b6d3-c56875d8741a	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
154df747-82ee-45b0-b6b1-4a7638fe12e2	25939211-bf7f-4658-95d5-40a0e6b562c1	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
03330b39-88ee-4fbc-a879-bc76cf16609f	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
0c927b07-6d8c-4df6-aafe-6d1f13851009	358ba0ad-51de-499d-9f0b-afebc303265f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
cfd40305-2af6-4869-bc5e-bb626061465d	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
b342931a-13e5-4a74-95e2-438a4f6d5c3f	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
38cf1186-8c55-4fcc-bb39-0708d44ecda2	316f17a8-6650-4a15-ac63-584b710e85d3	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
02457bee-b373-4679-b2e7-451a0597b4f3	452d708f-19a9-4295-ad7a-42826a21212f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
6dead875-26b0-44a3-b93e-7e55fe719f04	7e454624-36e5-4a0c-aeba-ecd50b76734f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
499dadfb-600b-4e52-8a78-dd0b096b1bb9	a21c633e-8260-4e3a-9ac7-46a34da28827	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
139382ef-dfb2-47ac-b303-2dbbba3be107	a1195634-f79d-41db-9193-10c2e68dfece	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
b6e38f5c-1df2-4748-893d-de3c5695cc65	ab9a418e-1e79-4fc4-877d-9c52baa03768	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
acf8cb3c-74c3-49d9-8be8-020524b87594	55e896ce-f843-4eed-aa1e-e937a7a5a84b	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
97dade2d-a7be-4562-a907-6747b304a5f0	e6647eb9-e85a-42d3-be5c-ff0536c215b8	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
7baf22d1-3838-4823-bdaf-50b9aa95349c	238a8ed1-5657-4fea-8221-85d2489b1d52	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
b9417253-c66a-4a1a-ab13-cbd813022fec	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
5a6f3a38-33e5-4e3b-b6cb-afb90f2a1716	7b74136f-d26a-48a3-9896-4369f6040d65	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
96bf6f84-b7b6-49cc-9ea5-0f7984f1b26b	42a1438a-1f58-4fb7-8085-46833848c9c3	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
013f7214-2fe6-4181-937b-3aa948c243e3	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
782d7a8a-fe6a-425b-bff0-97e479cf4605	598b3c2a-c143-44ea-9f3f-f1a180dd268b	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
e88d1171-f12e-457f-86a4-86ec54c3d828	478dcb48-fda6-4d62-aafe-9e7c16013f65	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
80ea74b7-9df4-4167-90c0-7f55a5dfdd2d	1a584474-6eb4-47e7-964f-ec7ef9340795	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
84c27bbc-ffd6-44c2-8c99-3c8981c2abaa	d9048a89-cc5d-484c-b402-c9a4f63d829a	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
7b496e69-a264-489e-86e6-93aee4709b16	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	47d8c413-5440-4d05-90cb-0757217fdfaf	t
3f685ed0-2890-4e48-b6ca-2d70b3b9b8d1	25939211-bf7f-4658-95d5-40a0e6b562c1	47d8c413-5440-4d05-90cb-0757217fdfaf	f
e710475c-45c9-4302-bfbd-1d8ed17a980d	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	47d8c413-5440-4d05-90cb-0757217fdfaf	f
363687ca-cf3d-455c-aa29-36af484cc964	358ba0ad-51de-499d-9f0b-afebc303265f	47d8c413-5440-4d05-90cb-0757217fdfaf	f
6aae1a5f-2d14-4615-82af-d863edf5dfab	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	47d8c413-5440-4d05-90cb-0757217fdfaf	f
cf316348-fbbd-47d6-ae6f-83e958d1747d	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	47d8c413-5440-4d05-90cb-0757217fdfaf	f
10831fac-39eb-4da8-b74e-288deada480d	316f17a8-6650-4a15-ac63-584b710e85d3	47d8c413-5440-4d05-90cb-0757217fdfaf	f
f01d7c1f-e020-417c-82bc-8780647f1233	452d708f-19a9-4295-ad7a-42826a21212f	47d8c413-5440-4d05-90cb-0757217fdfaf	f
6a35a064-8fae-44ad-9e8f-2caecac485aa	7e454624-36e5-4a0c-aeba-ecd50b76734f	47d8c413-5440-4d05-90cb-0757217fdfaf	t
10c35fb8-e51e-4190-ab75-b89c1b32c15e	a21c633e-8260-4e3a-9ac7-46a34da28827	47d8c413-5440-4d05-90cb-0757217fdfaf	t
11e11737-f1ab-4ba3-a443-03f2a7b69310	a1195634-f79d-41db-9193-10c2e68dfece	47d8c413-5440-4d05-90cb-0757217fdfaf	t
11034365-532e-4ce5-89f0-6d1859ef3271	ab9a418e-1e79-4fc4-877d-9c52baa03768	47d8c413-5440-4d05-90cb-0757217fdfaf	t
996c8fd4-8885-4708-aa47-17e43fd7d79c	55e896ce-f843-4eed-aa1e-e937a7a5a84b	47d8c413-5440-4d05-90cb-0757217fdfaf	t
e148d96e-9877-416e-ade8-a0a514a21e63	e6647eb9-e85a-42d3-be5c-ff0536c215b8	47d8c413-5440-4d05-90cb-0757217fdfaf	t
31369acf-d2d2-4ffe-8efa-01bb1b1668ce	238a8ed1-5657-4fea-8221-85d2489b1d52	47d8c413-5440-4d05-90cb-0757217fdfaf	t
8af00ea8-d087-4869-977a-5967f2c8f762	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	47d8c413-5440-4d05-90cb-0757217fdfaf	t
662ed5bf-e8f6-4250-a65f-5c67f2973189	7b74136f-d26a-48a3-9896-4369f6040d65	47d8c413-5440-4d05-90cb-0757217fdfaf	t
e2cd4784-e082-495b-9155-25aa329950ff	42a1438a-1f58-4fb7-8085-46833848c9c3	47d8c413-5440-4d05-90cb-0757217fdfaf	t
4a2e4c5c-d2b9-4520-a05e-dfb33a7b890f	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	47d8c413-5440-4d05-90cb-0757217fdfaf	t
8ba0e4a7-e726-458b-8b3f-53dc811dbeff	598b3c2a-c143-44ea-9f3f-f1a180dd268b	47d8c413-5440-4d05-90cb-0757217fdfaf	t
0dbbaef0-a8c1-4606-bf07-34e40f708b26	478dcb48-fda6-4d62-aafe-9e7c16013f65	47d8c413-5440-4d05-90cb-0757217fdfaf	t
3c9e2ce5-3e4d-4226-a647-0cfaff5c42f4	1a584474-6eb4-47e7-964f-ec7ef9340795	47d8c413-5440-4d05-90cb-0757217fdfaf	t
45dba876-db31-415c-aeb5-150cb5a8d1bf	d9048a89-cc5d-484c-b402-c9a4f63d829a	47d8c413-5440-4d05-90cb-0757217fdfaf	t
4ff6def9-02d6-4ca4-a1fa-5908883f30ea	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
6eac0845-14a3-4cf1-b28d-7992d64d076b	25939211-bf7f-4658-95d5-40a0e6b562c1	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
b38b9cac-65d0-48b9-8af2-323d1d3ef03b	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
eb26a922-d2f2-43e6-a0e7-9ccb3044b805	358ba0ad-51de-499d-9f0b-afebc303265f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
f1384f6e-a46b-4cb1-9424-8722307bd287	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
a4e3bad9-7f12-45c7-894f-6ab4e2113063	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
a6e22910-39c1-4b22-89d2-99cc09ba7874	316f17a8-6650-4a15-ac63-584b710e85d3	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
934d58c7-ff6e-4a14-a901-42c25ec922b1	452d708f-19a9-4295-ad7a-42826a21212f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
ebb44f38-62fb-4894-8974-d076cd107a3e	7e454624-36e5-4a0c-aeba-ecd50b76734f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
77f1fc89-8bb2-4d3a-a7b2-9b50846fbd9c	a21c633e-8260-4e3a-9ac7-46a34da28827	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
7dcc5a5c-629c-4ad5-8d87-becbcc3c40c4	a1195634-f79d-41db-9193-10c2e68dfece	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
2aef026a-5eb8-4f1d-ac0c-d6ff5f240f46	ab9a418e-1e79-4fc4-877d-9c52baa03768	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
3300ef53-9a55-408e-9e0c-df2447feb055	55e896ce-f843-4eed-aa1e-e937a7a5a84b	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
c74ccbab-20b6-4465-b4bf-c62a65a4dc1f	e6647eb9-e85a-42d3-be5c-ff0536c215b8	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
1995335e-243c-461f-b1e8-55bf538e1df9	238a8ed1-5657-4fea-8221-85d2489b1d52	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
5e34da8d-1284-41c9-bd5e-4310daa9a54d	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
67440234-fcfd-40e3-b3a9-bb66f412d7de	7b74136f-d26a-48a3-9896-4369f6040d65	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
59a88d7a-753d-4771-b10f-ae79376ae085	42a1438a-1f58-4fb7-8085-46833848c9c3	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
d02a353e-31d9-4d27-8307-bd5b79d7a8ed	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
a5da67df-53de-4300-ab0f-71a40c268aa8	598b3c2a-c143-44ea-9f3f-f1a180dd268b	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
e9928642-7acf-4920-a19c-17bcc22fe8ae	478dcb48-fda6-4d62-aafe-9e7c16013f65	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
37d8dc40-d953-4044-a033-1d80b82cc748	1a584474-6eb4-47e7-964f-ec7ef9340795	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
fb2a7621-cd13-4a87-b192-24073bec67cd	d9048a89-cc5d-484c-b402-c9a4f63d829a	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
b3d18512-52a8-48dd-a49b-c2e13d8c6ec9	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
c4115da8-bed4-4043-bc16-84144aacb4f5	25939211-bf7f-4658-95d5-40a0e6b562c1	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
e09ef895-db0c-4f3d-a539-685743273db7	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
a8567191-a7ba-4b50-a5fe-f7e31f810ade	358ba0ad-51de-499d-9f0b-afebc303265f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
5af06895-a7a6-44d0-95a6-061ba5d30209	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
8d7b5ce3-c51c-47d5-b410-8dfcda5ea1de	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
97b7d8f6-01ac-4eb6-9e1d-78c2ef4693dd	316f17a8-6650-4a15-ac63-584b710e85d3	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
d71bfb4d-cc34-4134-95fc-9b7d3a6fbadd	452d708f-19a9-4295-ad7a-42826a21212f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
fb451a62-22c2-4a45-b0c4-84a6395a7961	7e454624-36e5-4a0c-aeba-ecd50b76734f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
477123f1-97fe-4b0f-bfe2-446bf656daa1	a21c633e-8260-4e3a-9ac7-46a34da28827	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
1a4c191e-09ee-448c-8092-450fa15e5084	a1195634-f79d-41db-9193-10c2e68dfece	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
95458127-94cf-42cd-b61c-6ee1656959a9	ab9a418e-1e79-4fc4-877d-9c52baa03768	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
c7b5b88e-6bf3-41d5-b888-6110d0fc87d8	55e896ce-f843-4eed-aa1e-e937a7a5a84b	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
0c3a3c34-bdfa-40f7-8fb0-227e572a6127	e6647eb9-e85a-42d3-be5c-ff0536c215b8	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
72c3c443-6ad8-4a36-b50c-806be6aa8b7a	238a8ed1-5657-4fea-8221-85d2489b1d52	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
1208d10f-0b5a-42ab-8bc5-9d5cdc80bbaf	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
d803484d-133a-4ef5-925b-010bac12b74d	7b74136f-d26a-48a3-9896-4369f6040d65	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
58c92dad-8943-4bfd-8ad0-9a55d33dea5f	42a1438a-1f58-4fb7-8085-46833848c9c3	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
d5788d85-1830-4b11-9549-5ed13eaee3a7	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
6d5131c0-01d5-4958-817b-8861d84e0f5d	598b3c2a-c143-44ea-9f3f-f1a180dd268b	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
3774eb4c-ff99-411e-aeab-92b74457d43f	478dcb48-fda6-4d62-aafe-9e7c16013f65	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
37fc136f-554f-4912-b7b0-e30cc635372d	1a584474-6eb4-47e7-964f-ec7ef9340795	d1dce1c9-e82b-4efb-8d22-00117a37b94a	f
f584ec60-bc1d-470c-a981-89fca91c9414	d9048a89-cc5d-484c-b402-c9a4f63d829a	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
a34ba7bd-42e3-40aa-80c1-d8fa087e9cf1	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
ad1aeab5-5fcd-4986-ac1c-a4bafd7a716e	25939211-bf7f-4658-95d5-40a0e6b562c1	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
ea4d62ad-075f-4cca-bb8d-b28264e0f37f	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
8072fdb7-d00a-43f3-8c2d-f12a30bead65	358ba0ad-51de-499d-9f0b-afebc303265f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
54fb9cf3-be5e-48e8-a55a-0cfc88d12fa3	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
924d78a8-00fa-4c72-ba48-58c061ae3624	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
ad238203-0ff8-4103-a0c2-c71cdf1fa7e6	316f17a8-6650-4a15-ac63-584b710e85d3	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
d9139e70-fc75-493f-915b-c17b5fce0d6e	452d708f-19a9-4295-ad7a-42826a21212f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
435021cb-e75c-4d61-a371-c1561bc5bc11	7e454624-36e5-4a0c-aeba-ecd50b76734f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
016e93ec-b60b-4bb9-bb3b-000d186ebaf2	a21c633e-8260-4e3a-9ac7-46a34da28827	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
2ff4f220-8f14-4564-988e-30241f413aaf	a1195634-f79d-41db-9193-10c2e68dfece	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
bd654d15-98e9-4559-ad8d-91244eb23335	ab9a418e-1e79-4fc4-877d-9c52baa03768	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
4f27c7a6-728f-4911-a6e4-ba14f5cd5061	55e896ce-f843-4eed-aa1e-e937a7a5a84b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
88432b54-4bf8-4584-ad98-00e5f83dfc4f	e6647eb9-e85a-42d3-be5c-ff0536c215b8	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
131841a5-70f2-40e3-b773-50f0bbb0de0a	238a8ed1-5657-4fea-8221-85d2489b1d52	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
b1f8b653-bf12-4bf5-bb2e-415aa80494a2	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
04422bfa-71e7-4a56-ac2a-56dfb92763bc	7b74136f-d26a-48a3-9896-4369f6040d65	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
2a3e8600-1916-4c97-9d99-651a52f18b25	42a1438a-1f58-4fb7-8085-46833848c9c3	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
f38329d0-65ec-4905-8f6a-b91c14371df7	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
222cb485-77c3-4840-a05a-fec678263652	598b3c2a-c143-44ea-9f3f-f1a180dd268b	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
f120504b-6a85-4c24-ae7f-bd95ad561ee3	478dcb48-fda6-4d62-aafe-9e7c16013f65	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
2d04430c-71dd-4581-9d5f-7f6ffd05eb9c	1a584474-6eb4-47e7-964f-ec7ef9340795	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	f
83507678-2899-4068-ba9e-3e73d21f9208	d9048a89-cc5d-484c-b402-c9a4f63d829a	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
a9919582-51ab-4b56-b2af-89699fef5b85	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
043bbf55-806b-47c2-8be5-c679a7b8f98f	25939211-bf7f-4658-95d5-40a0e6b562c1	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
a3ccff9c-5790-485a-8c59-5f3db7a535f0	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
fd49d67c-7b52-450f-92b2-6ac82a668138	358ba0ad-51de-499d-9f0b-afebc303265f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
1bd00c77-b3db-4bc0-a07b-83a9afdaab0b	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
f49f0392-8f28-4c0e-bbef-99dea88f504a	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
944c6996-46a7-45b1-bb77-a8d013725f4b	316f17a8-6650-4a15-ac63-584b710e85d3	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
05441e44-62bc-4ab5-aecd-31ef96800788	452d708f-19a9-4295-ad7a-42826a21212f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
aebc8b5b-0743-4753-8520-5f3e9e1d813e	7e454624-36e5-4a0c-aeba-ecd50b76734f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
4b2204bb-b1ca-4b84-b4f3-610fa1041feb	a21c633e-8260-4e3a-9ac7-46a34da28827	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
235bd041-d406-43f2-89ab-886e58772202	a1195634-f79d-41db-9193-10c2e68dfece	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
1c6e4eea-50be-4889-b942-a3d2da5f5c59	ab9a418e-1e79-4fc4-877d-9c52baa03768	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
5a31c1b0-a18a-40cf-b448-5483bce4144a	55e896ce-f843-4eed-aa1e-e937a7a5a84b	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
04e4c84f-0759-4fe6-98bf-62c70192848c	e6647eb9-e85a-42d3-be5c-ff0536c215b8	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
179b910e-83e9-4912-b431-d9104b9cfff4	238a8ed1-5657-4fea-8221-85d2489b1d52	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
9d55f665-8e09-4e36-88fe-9b87a07f415d	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
6e2e9dea-2339-410e-8f61-42cd2238e6c4	7b74136f-d26a-48a3-9896-4369f6040d65	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
f6aa84af-b747-4eb9-92bf-60e51167343e	42a1438a-1f58-4fb7-8085-46833848c9c3	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
983cc98f-3eb9-46f7-a43c-e03c1b8678a3	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
25e8b5ff-c540-4a2c-966b-20e2dec9d5f6	598b3c2a-c143-44ea-9f3f-f1a180dd268b	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
eb2cd6be-7eda-4f86-9966-7c649122cd62	478dcb48-fda6-4d62-aafe-9e7c16013f65	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
20fd1c07-a473-490a-813c-501e9ceb236e	1a584474-6eb4-47e7-964f-ec7ef9340795	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
a1f872bb-cc2f-4688-adb8-ac2e6a600803	d9048a89-cc5d-484c-b402-c9a4f63d829a	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
fa369fa3-9c27-4f97-81f5-c4bdbaec1307	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	e79979e1-326f-4b84-b613-ce32953d1f05	t
58cab7ef-6995-4d76-978a-153c5fd613b4	25939211-bf7f-4658-95d5-40a0e6b562c1	e79979e1-326f-4b84-b613-ce32953d1f05	t
0150efce-df89-4233-a029-f928a7dea580	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	e79979e1-326f-4b84-b613-ce32953d1f05	t
2cb36f36-b676-4a0f-ae94-8f65363d4eae	358ba0ad-51de-499d-9f0b-afebc303265f	e79979e1-326f-4b84-b613-ce32953d1f05	t
bbb7e440-d8dd-4c25-856f-f6fd4dc156bd	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	e79979e1-326f-4b84-b613-ce32953d1f05	t
f71d260e-49a7-47fd-b0a3-3a759dcb6a28	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	e79979e1-326f-4b84-b613-ce32953d1f05	t
3227a057-d485-4474-95af-18ad37226111	316f17a8-6650-4a15-ac63-584b710e85d3	e79979e1-326f-4b84-b613-ce32953d1f05	t
4e6aa851-da5a-4a91-b1df-711ff2d7d48a	452d708f-19a9-4295-ad7a-42826a21212f	e79979e1-326f-4b84-b613-ce32953d1f05	t
70b2ba36-b506-4538-9dec-5cdf94785eb4	7e454624-36e5-4a0c-aeba-ecd50b76734f	e79979e1-326f-4b84-b613-ce32953d1f05	t
65b1c335-c097-4eaf-ae28-b31f532db270	a21c633e-8260-4e3a-9ac7-46a34da28827	e79979e1-326f-4b84-b613-ce32953d1f05	t
f8e30dda-7b2f-4bd5-81cd-d1a2df5474a5	a1195634-f79d-41db-9193-10c2e68dfece	e79979e1-326f-4b84-b613-ce32953d1f05	t
4b7afe7c-fb34-441b-8750-234de0aebde3	ab9a418e-1e79-4fc4-877d-9c52baa03768	e79979e1-326f-4b84-b613-ce32953d1f05	t
dc414ef8-6ae7-48ee-85b9-9f2ab9f1c44b	55e896ce-f843-4eed-aa1e-e937a7a5a84b	e79979e1-326f-4b84-b613-ce32953d1f05	t
afcca958-cc07-40b2-a2b0-89a137c5a9c3	e6647eb9-e85a-42d3-be5c-ff0536c215b8	e79979e1-326f-4b84-b613-ce32953d1f05	t
470f6b6e-0e4e-4a51-82d2-5eab62294f4d	238a8ed1-5657-4fea-8221-85d2489b1d52	e79979e1-326f-4b84-b613-ce32953d1f05	t
676224c3-151c-4fd5-b8ef-a52709beeee4	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	e79979e1-326f-4b84-b613-ce32953d1f05	t
675da1a8-a0a6-4973-a5ed-3250ee38adef	7b74136f-d26a-48a3-9896-4369f6040d65	e79979e1-326f-4b84-b613-ce32953d1f05	t
6e219061-483e-4fab-b4c9-321e2c06a297	42a1438a-1f58-4fb7-8085-46833848c9c3	e79979e1-326f-4b84-b613-ce32953d1f05	t
b2241d38-9b0e-4274-a4e8-243bc7575a16	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	e79979e1-326f-4b84-b613-ce32953d1f05	t
d016236b-bd6e-44d8-826a-c3008e9474ad	598b3c2a-c143-44ea-9f3f-f1a180dd268b	e79979e1-326f-4b84-b613-ce32953d1f05	t
0e619bed-bfff-4cae-be09-f0ec79ff55df	478dcb48-fda6-4d62-aafe-9e7c16013f65	e79979e1-326f-4b84-b613-ce32953d1f05	t
5dfa4ecc-d1c9-4a42-9356-1dafa8accd22	1a584474-6eb4-47e7-964f-ec7ef9340795	e79979e1-326f-4b84-b613-ce32953d1f05	t
4ef7f0ac-12ed-43b8-be4d-7660a090e1be	d9048a89-cc5d-484c-b402-c9a4f63d829a	e79979e1-326f-4b84-b613-ce32953d1f05	t
2f68fbe8-c7de-4b06-b260-cc2ac6e27de3	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	11c8fe77-61a2-4761-b804-46106525f467	t
202911a2-b169-4c75-b5aa-52af55b13bde	25939211-bf7f-4658-95d5-40a0e6b562c1	11c8fe77-61a2-4761-b804-46106525f467	t
fb7d67c7-5d72-4193-b81b-923c10429947	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	11c8fe77-61a2-4761-b804-46106525f467	t
eef189dc-e278-4ca1-88c8-1b52ad6ed312	358ba0ad-51de-499d-9f0b-afebc303265f	11c8fe77-61a2-4761-b804-46106525f467	t
d1762c98-ff17-43bc-99c4-a7974e2743b5	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	11c8fe77-61a2-4761-b804-46106525f467	t
f5cb2f36-20cc-4409-b30c-d0c4bbd6668f	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	11c8fe77-61a2-4761-b804-46106525f467	t
f9812de2-ce97-43b9-987b-55c34f10aa04	316f17a8-6650-4a15-ac63-584b710e85d3	11c8fe77-61a2-4761-b804-46106525f467	t
63d6d632-f434-4212-9fcf-9a804cb72a55	452d708f-19a9-4295-ad7a-42826a21212f	11c8fe77-61a2-4761-b804-46106525f467	t
508c7ab3-8cda-4cf5-baf0-1fc494429395	7e454624-36e5-4a0c-aeba-ecd50b76734f	11c8fe77-61a2-4761-b804-46106525f467	t
2ad91a98-40cf-4f38-8ef9-1a5d63ad7f91	a21c633e-8260-4e3a-9ac7-46a34da28827	11c8fe77-61a2-4761-b804-46106525f467	t
ca0abf81-acf9-4b8c-92ea-51729d2a899e	a1195634-f79d-41db-9193-10c2e68dfece	11c8fe77-61a2-4761-b804-46106525f467	t
fac8d7d1-c01f-453d-aaed-43192f2dc18a	ab9a418e-1e79-4fc4-877d-9c52baa03768	11c8fe77-61a2-4761-b804-46106525f467	t
ff797cb0-c724-44bf-bd5d-e835de9b6b26	55e896ce-f843-4eed-aa1e-e937a7a5a84b	11c8fe77-61a2-4761-b804-46106525f467	t
624d676c-6b7e-475f-bd91-aa32aacc158b	e6647eb9-e85a-42d3-be5c-ff0536c215b8	11c8fe77-61a2-4761-b804-46106525f467	t
8a0d2ed4-c267-4507-8dd6-1c4cde4219d2	238a8ed1-5657-4fea-8221-85d2489b1d52	11c8fe77-61a2-4761-b804-46106525f467	t
9423d69f-9312-4437-889b-315ac4744b72	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	11c8fe77-61a2-4761-b804-46106525f467	t
e7e0e48c-fff5-4b74-8ecd-3621bb084596	7b74136f-d26a-48a3-9896-4369f6040d65	11c8fe77-61a2-4761-b804-46106525f467	t
20adc352-8bed-4554-ba5d-77de09d53ca8	42a1438a-1f58-4fb7-8085-46833848c9c3	11c8fe77-61a2-4761-b804-46106525f467	t
71adea48-4887-4eba-a8f9-02f59d9a9898	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	11c8fe77-61a2-4761-b804-46106525f467	t
43b346cb-81fb-413f-a6da-b9ecf97c80c3	598b3c2a-c143-44ea-9f3f-f1a180dd268b	11c8fe77-61a2-4761-b804-46106525f467	t
a981606a-c9c2-4a13-a5d9-532bdda27eb6	478dcb48-fda6-4d62-aafe-9e7c16013f65	11c8fe77-61a2-4761-b804-46106525f467	t
81dcf0ef-bf03-4e13-b509-a8bfcf682825	1a584474-6eb4-47e7-964f-ec7ef9340795	11c8fe77-61a2-4761-b804-46106525f467	f
380d6a4b-f3f4-42fb-8226-e168f9566800	d9048a89-cc5d-484c-b402-c9a4f63d829a	11c8fe77-61a2-4761-b804-46106525f467	t
cbd3b3eb-5521-43e0-9e09-1776c2f842b7	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
617317e9-4555-4fad-8148-7fbb7100109f	25939211-bf7f-4658-95d5-40a0e6b562c1	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
b259f59f-e65d-4931-aa6c-08b3e4e91b8e	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
e8d89c1c-24c8-4e61-85d4-240e63f9f405	358ba0ad-51de-499d-9f0b-afebc303265f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
1f1e4b32-c517-4397-90c5-52d864f413c2	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
0269c344-d8d9-4a1a-85df-d3367f076cb0	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
01d40416-0a77-4e88-b8ca-a2eb3427cb80	316f17a8-6650-4a15-ac63-584b710e85d3	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
86d3032b-31e6-4a0f-973c-d9dac5411ec6	452d708f-19a9-4295-ad7a-42826a21212f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
eeee1046-8f44-49fd-ab27-103767663267	7e454624-36e5-4a0c-aeba-ecd50b76734f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
5e930b14-9388-4002-a833-2f5f084b5f25	a21c633e-8260-4e3a-9ac7-46a34da28827	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
8e4c062d-3c6a-428a-9f8e-c54e1fec6649	a1195634-f79d-41db-9193-10c2e68dfece	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
4e72c284-6d6b-43ac-b2d1-388825e29daf	ab9a418e-1e79-4fc4-877d-9c52baa03768	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
3f71eff4-8788-4072-8052-7502f0fd41e7	55e896ce-f843-4eed-aa1e-e937a7a5a84b	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
582ec251-4d97-43a5-a5df-71058e1018db	e6647eb9-e85a-42d3-be5c-ff0536c215b8	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
c7748ffb-ef4f-4bf7-8626-6d9b5e1f9291	238a8ed1-5657-4fea-8221-85d2489b1d52	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
dfbab455-3961-4929-b03a-27b01630c85d	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
cde2c82b-1c2a-45fa-8b7c-0caf159193d6	7b74136f-d26a-48a3-9896-4369f6040d65	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
82934663-a66c-4005-a491-ec16f9790eb6	42a1438a-1f58-4fb7-8085-46833848c9c3	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
32a02245-1b51-440f-9d68-f042eb315f2c	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
affe0dd4-50fb-41ac-ad77-12fe7e9d5583	598b3c2a-c143-44ea-9f3f-f1a180dd268b	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
1ec097f6-7760-4337-b83c-ab801f0040b1	478dcb48-fda6-4d62-aafe-9e7c16013f65	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
7a74317c-450e-4143-b16e-5b2e60913441	1a584474-6eb4-47e7-964f-ec7ef9340795	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
d52a1dab-a77d-43a6-ba28-9b630b3216e3	d9048a89-cc5d-484c-b402-c9a4f63d829a	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
89c51b37-ebdc-4c91-9173-570accdb66a7	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
74abd748-16a7-4574-bb7d-c8303cc75722	25939211-bf7f-4658-95d5-40a0e6b562c1	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
c147fa77-c467-44bb-930b-eb231eeded0e	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
52ef6235-f72c-4976-864e-8d33dcd2e31b	358ba0ad-51de-499d-9f0b-afebc303265f	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
292a7373-654e-447b-a1e1-a48079d84737	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
4b5dd792-8775-42e8-bf67-83c37198180e	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
2aaa80ca-19ad-4a85-b259-47528e175004	316f17a8-6650-4a15-ac63-584b710e85d3	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
e2202890-1b48-44a3-802e-6ca14f3ae118	452d708f-19a9-4295-ad7a-42826a21212f	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
5b66b335-3872-43e7-b28d-3c0b617e1213	7e454624-36e5-4a0c-aeba-ecd50b76734f	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
f053a3a3-f139-499d-8103-2ef1f825f5f3	a21c633e-8260-4e3a-9ac7-46a34da28827	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
59d4b0a6-b3ec-4805-85ad-f70ccd47ef16	a1195634-f79d-41db-9193-10c2e68dfece	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
fafa288c-139a-4027-b2b1-78ca34ce1c4d	ab9a418e-1e79-4fc4-877d-9c52baa03768	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
ae6efaf0-d5d8-46c0-9856-117a6fe8d4cb	55e896ce-f843-4eed-aa1e-e937a7a5a84b	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
977d8baf-c25e-496e-9031-5168393ebad2	e6647eb9-e85a-42d3-be5c-ff0536c215b8	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
4dd046e1-8af4-496d-ac86-4b2917830e1a	238a8ed1-5657-4fea-8221-85d2489b1d52	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
0d0dbf29-b36d-4ef5-a86f-0cacd8906a8e	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
68085f53-d12c-4daf-a8c8-9af90d534920	7b74136f-d26a-48a3-9896-4369f6040d65	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
5f1434ab-fc5d-4dcd-94e9-235679a5aa51	42a1438a-1f58-4fb7-8085-46833848c9c3	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
7c5e4edc-769d-4e96-b536-8b9472c7d9d2	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
f6220d25-ab34-4173-b28f-6cc9aafb0ccb	598b3c2a-c143-44ea-9f3f-f1a180dd268b	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
85a17c6e-e145-4d38-ab4b-5d1a0deafbb3	478dcb48-fda6-4d62-aafe-9e7c16013f65	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
467fd30d-a793-4aec-aadc-c85b4fda61a2	1a584474-6eb4-47e7-964f-ec7ef9340795	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
3ce599ac-67fb-4803-88a1-6ee839db740a	d9048a89-cc5d-484c-b402-c9a4f63d829a	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
94dd3b2e-1283-4ea7-95d4-1d19d5e3a750	cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	c827a01f-387c-4c59-bfcd-829297a30a74	t
4fe9ec42-6d21-447c-af57-61835bba91f9	25939211-bf7f-4658-95d5-40a0e6b562c1	c827a01f-387c-4c59-bfcd-829297a30a74	f
eb1a7d86-5e69-4a4e-98f5-5de04f5d5790	d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	c827a01f-387c-4c59-bfcd-829297a30a74	f
ae16b428-6b29-4485-9091-c27611ddd3f0	358ba0ad-51de-499d-9f0b-afebc303265f	c827a01f-387c-4c59-bfcd-829297a30a74	f
ef720e29-397e-4780-baec-674ad36094d0	94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	c827a01f-387c-4c59-bfcd-829297a30a74	f
e1b958cd-3d25-4700-ae68-11cd9a564d62	6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	c827a01f-387c-4c59-bfcd-829297a30a74	f
e6e3f606-c30e-4857-b6a4-2caf28774a62	316f17a8-6650-4a15-ac63-584b710e85d3	c827a01f-387c-4c59-bfcd-829297a30a74	f
6af39953-ec10-4055-9e3c-a3feb7e225c6	452d708f-19a9-4295-ad7a-42826a21212f	c827a01f-387c-4c59-bfcd-829297a30a74	f
1783b1e7-add0-43c4-902c-af43e7fa8787	7e454624-36e5-4a0c-aeba-ecd50b76734f	c827a01f-387c-4c59-bfcd-829297a30a74	t
066238bf-10ea-40cb-ba04-172ee56c0541	a21c633e-8260-4e3a-9ac7-46a34da28827	c827a01f-387c-4c59-bfcd-829297a30a74	t
e9d24dfb-9846-4fb9-9e58-0120529fe0d3	a1195634-f79d-41db-9193-10c2e68dfece	c827a01f-387c-4c59-bfcd-829297a30a74	t
e05fc87c-c280-4f62-bf02-9aeb1b03f407	ab9a418e-1e79-4fc4-877d-9c52baa03768	c827a01f-387c-4c59-bfcd-829297a30a74	t
e6bc906d-ba42-43a2-bad8-8e850dc96e36	55e896ce-f843-4eed-aa1e-e937a7a5a84b	c827a01f-387c-4c59-bfcd-829297a30a74	t
7548a755-035d-41fb-88e8-9bff7e317217	e6647eb9-e85a-42d3-be5c-ff0536c215b8	c827a01f-387c-4c59-bfcd-829297a30a74	t
9791e2d9-df4a-4dfb-9c5a-0afd5b4d995f	238a8ed1-5657-4fea-8221-85d2489b1d52	c827a01f-387c-4c59-bfcd-829297a30a74	t
0b23523f-3613-4fd1-80eb-5c647ca22280	a02d62b1-d14e-4f30-85a4-25ee0ce66be2	c827a01f-387c-4c59-bfcd-829297a30a74	t
6b784d87-fc84-4fe6-bf35-10ec02d7ea03	7b74136f-d26a-48a3-9896-4369f6040d65	c827a01f-387c-4c59-bfcd-829297a30a74	t
c0a8545e-381d-49b6-965c-5dcad46db058	42a1438a-1f58-4fb7-8085-46833848c9c3	c827a01f-387c-4c59-bfcd-829297a30a74	t
ae51dd11-322b-4ef4-a364-8d0d335f1ef0	f96ed8ef-6b4b-451e-9af6-ed8592fc9678	c827a01f-387c-4c59-bfcd-829297a30a74	t
ddcc1b07-d88f-4cd3-b383-6dce36814d4e	598b3c2a-c143-44ea-9f3f-f1a180dd268b	c827a01f-387c-4c59-bfcd-829297a30a74	t
b6fb9fcb-04de-4ba0-b656-5ea0a90501b2	478dcb48-fda6-4d62-aafe-9e7c16013f65	c827a01f-387c-4c59-bfcd-829297a30a74	t
2677b31b-e521-472b-92cd-48a3ac9b5818	1a584474-6eb4-47e7-964f-ec7ef9340795	c827a01f-387c-4c59-bfcd-829297a30a74	t
b70c16d2-2513-48db-af8c-c339e51461db	d9048a89-cc5d-484c-b402-c9a4f63d829a	c827a01f-387c-4c59-bfcd-829297a30a74	t
0d73b342-106e-415e-9ba1-29172793957f	5b3f094c-3897-4fa3-adad-8469c040f013	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
2f1ad67e-1ef5-437f-958d-c337dc3a2865	1cf9bbfa-3ade-4997-b4de-7ec868abe610	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
cd4fe5b6-842e-46be-8378-4f486a0c61f2	5ee6f424-dea8-4ee1-bcec-f89faecf9931	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
62fcf10c-1e2a-4a95-9aa8-21b639eeaec3	e0a663ac-aaa5-47cc-9e22-a9cd71853246	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
fcae1cd4-7c84-419d-94b1-e945683bbce6	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
18a6e8d5-6695-473e-be07-7e4ef2b6fdcf	575a9512-8b91-4d99-a8be-f267fce026dd	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
d2d0799e-3fb8-4df4-8703-305674343772	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
743dfb2d-722b-490b-89eb-6e3e9944a254	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
ba94c114-81de-4d83-a225-a8852fc34e7d	a8034fcf-21f4-49e8-a235-f33779c63ca8	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
adcc6d12-7ad6-4dad-b8f0-124f3e9400fb	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
9eb45ced-1c14-4d08-a2f9-7707dce08e21	3ad98109-36cd-4560-a513-86387065f22a	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
47719cb6-a863-4f00-a04d-1d08d70b520e	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
bc4c8161-4459-4f9a-a4ff-0ad4c6d58b0b	0081c05f-e65c-46ec-8126-71e4ce15e2e4	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
59a946ec-cadc-4801-becc-e400011ad679	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
12c6a6e3-bfa1-4d1b-8709-b654d9f6730a	3a698be0-2982-4e83-b1f7-84ece51e725f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
603aa902-9680-4f1a-824d-b55c87d03a0a	0db42258-ad0d-4141-9275-fd034517ec3c	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
6dde3ae7-086b-42e0-a520-de1b833559b1	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
53db313f-da1e-4fd4-8ac0-3623eab9ecb0	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
efccdc5b-8e4f-42c7-b1bf-30774dfcafd7	d6d99884-3731-41d8-b516-26b1dd281f41	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
6405ff41-ab20-441a-a5d5-e9e02801a834	89eb4bea-11b5-423c-84ee-d938cc4c349d	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
4fcadc71-510f-48b9-b362-b6723cc4b182	500f45ef-8fa4-48b4-99cf-99edb720aee9	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	f
c33f4c74-9f0e-437c-aab3-2408fd15d369	a97cca97-0497-444b-8ab2-d5eb0170a835	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
18bf0ab8-d464-404f-bba3-fe98c0934ce4	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	t
a21e92cc-134f-4c05-94e5-91cb9ec8f1f9	5b3f094c-3897-4fa3-adad-8469c040f013	ab8d6a3a-8889-442c-996e-15825a25e37f	f
ff7e9797-394a-4391-8abd-f4b3fde4e43b	1cf9bbfa-3ade-4997-b4de-7ec868abe610	ab8d6a3a-8889-442c-996e-15825a25e37f	t
dc133b6b-8d7e-45a9-9e0e-c1b82c249a3e	5ee6f424-dea8-4ee1-bcec-f89faecf9931	ab8d6a3a-8889-442c-996e-15825a25e37f	f
f4d7b327-515a-435c-8d36-8dc10f5b1fd2	e0a663ac-aaa5-47cc-9e22-a9cd71853246	ab8d6a3a-8889-442c-996e-15825a25e37f	f
b6f8ed64-4dcf-4eb7-a3ca-81dd1f0dba31	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	ab8d6a3a-8889-442c-996e-15825a25e37f	f
08d35d96-c7d0-4985-bc7e-4c0594ea133e	575a9512-8b91-4d99-a8be-f267fce026dd	ab8d6a3a-8889-442c-996e-15825a25e37f	t
17925e10-4837-4529-9723-0a96bca21478	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	ab8d6a3a-8889-442c-996e-15825a25e37f	f
0834f201-dcf1-402b-a49d-69d521e526e7	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	ab8d6a3a-8889-442c-996e-15825a25e37f	f
adbb7237-ee15-4a86-801e-b2143e33f7bc	a8034fcf-21f4-49e8-a235-f33779c63ca8	ab8d6a3a-8889-442c-996e-15825a25e37f	t
2dc1f741-43af-42c9-bcef-ad617dd23dd3	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	ab8d6a3a-8889-442c-996e-15825a25e37f	t
f8552abd-93e5-4887-bfdf-a797db3480e0	3ad98109-36cd-4560-a513-86387065f22a	ab8d6a3a-8889-442c-996e-15825a25e37f	t
18781395-d05e-40fd-8229-041938545b2c	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	ab8d6a3a-8889-442c-996e-15825a25e37f	t
33f6b5db-b150-4ee3-a84f-94707c399d5a	0081c05f-e65c-46ec-8126-71e4ce15e2e4	ab8d6a3a-8889-442c-996e-15825a25e37f	t
174731d2-e72d-49c2-8af6-d295e7b3e52c	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	ab8d6a3a-8889-442c-996e-15825a25e37f	t
0a97b318-0a75-4844-81b0-d69f3246d7f0	3a698be0-2982-4e83-b1f7-84ece51e725f	ab8d6a3a-8889-442c-996e-15825a25e37f	t
9eb872b3-0afe-4bcb-9c82-c17da04b369d	0db42258-ad0d-4141-9275-fd034517ec3c	ab8d6a3a-8889-442c-996e-15825a25e37f	t
352dad25-40b1-4bb6-ac4c-818ac1e0cce4	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	ab8d6a3a-8889-442c-996e-15825a25e37f	t
6febedd5-4612-4eaa-8e59-f05a31c255a1	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	ab8d6a3a-8889-442c-996e-15825a25e37f	f
5b737962-f3d3-4f04-ae27-cd62ee431392	d6d99884-3731-41d8-b516-26b1dd281f41	ab8d6a3a-8889-442c-996e-15825a25e37f	t
aedfcb2a-97e4-44e6-a419-19ad264dc12e	89eb4bea-11b5-423c-84ee-d938cc4c349d	ab8d6a3a-8889-442c-996e-15825a25e37f	t
bb60240e-fb51-4626-ae7b-b8dce2b56767	500f45ef-8fa4-48b4-99cf-99edb720aee9	ab8d6a3a-8889-442c-996e-15825a25e37f	f
b064d153-1b03-4645-ac7e-10c7d255dee4	a97cca97-0497-444b-8ab2-d5eb0170a835	ab8d6a3a-8889-442c-996e-15825a25e37f	t
bf78a54e-3a45-42a7-9f1a-3990ca705aa0	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	ab8d6a3a-8889-442c-996e-15825a25e37f	t
710807cf-39b6-4b9c-88df-727093f48692	5b3f094c-3897-4fa3-adad-8469c040f013	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
ead1ee34-ced6-467e-8c97-5738a61d16af	1cf9bbfa-3ade-4997-b4de-7ec868abe610	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
222a1dba-6817-497d-97d7-ef94731d66ac	5ee6f424-dea8-4ee1-bcec-f89faecf9931	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
84a34972-2d1c-4bff-9762-120a10fa4585	e0a663ac-aaa5-47cc-9e22-a9cd71853246	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
511d93a9-f372-470b-b68f-4aa7a872df00	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
98611092-e0c1-46fe-884f-fde0298e00f2	575a9512-8b91-4d99-a8be-f267fce026dd	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
c5408194-a8c2-490d-992c-445758a801fc	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
c0894482-f00d-490c-bbb3-d97954e64c95	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
e5300e08-808c-4005-bf68-d24f63c2a266	a8034fcf-21f4-49e8-a235-f33779c63ca8	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
20b0c2f3-b090-4ce5-a5ee-5153e5b74248	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
6ed6df7b-26ff-45c3-91f2-98cb80c513b5	3ad98109-36cd-4560-a513-86387065f22a	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
394c0482-5dad-4ab5-b226-c56141d26f4c	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
38b7c5a0-b4af-4af0-8670-396fc3951277	0081c05f-e65c-46ec-8126-71e4ce15e2e4	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
27549893-7d0d-4476-8b50-0d1c7bceab73	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
0b1b0501-0a75-4343-a5f6-0b2fe1788fae	3a698be0-2982-4e83-b1f7-84ece51e725f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
dc686208-4745-4f9a-8f3f-19c039af71b7	0db42258-ad0d-4141-9275-fd034517ec3c	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
d5a85285-6f2b-46f6-b952-e1b34a9d3932	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
feb8ebe2-ba09-4c41-8dfe-87f972745c77	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
ba868566-200e-40aa-82fd-eea777461d91	d6d99884-3731-41d8-b516-26b1dd281f41	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
00246660-0864-4401-b358-9b1c4c29b6b1	89eb4bea-11b5-423c-84ee-d938cc4c349d	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
262ea963-1dd7-4107-b32a-4bfac9779cd9	500f45ef-8fa4-48b4-99cf-99edb720aee9	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	f
6d482a28-ad92-4501-8682-2ed721f1ebe9	a97cca97-0497-444b-8ab2-d5eb0170a835	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
49dca6b8-f2e0-40a7-82f0-fb23d702fe63	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	t
e5b21a5b-1237-4b5b-8876-3266e41185d5	5b3f094c-3897-4fa3-adad-8469c040f013	ae753320-c362-4d8b-8294-53533a1a5798	f
0b78a6aa-71b1-4a4d-bf24-c4cfd9dd2298	1cf9bbfa-3ade-4997-b4de-7ec868abe610	ae753320-c362-4d8b-8294-53533a1a5798	t
52fa99eb-7768-427b-9c30-bed989a1b285	5ee6f424-dea8-4ee1-bcec-f89faecf9931	ae753320-c362-4d8b-8294-53533a1a5798	t
b9a266cf-8b0b-4495-9ea0-d59d60cddac5	e0a663ac-aaa5-47cc-9e22-a9cd71853246	ae753320-c362-4d8b-8294-53533a1a5798	f
d4bff3fd-ee8d-4e1f-a8d8-75aaad2844ff	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	ae753320-c362-4d8b-8294-53533a1a5798	t
ad8e2ad4-5adc-4196-8e34-cfb304e1b518	575a9512-8b91-4d99-a8be-f267fce026dd	ae753320-c362-4d8b-8294-53533a1a5798	t
ec3e2d2c-756c-444c-a474-fc0ceb455378	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	ae753320-c362-4d8b-8294-53533a1a5798	t
64258954-1d6f-4119-b5e0-393762816ff8	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	ae753320-c362-4d8b-8294-53533a1a5798	f
1fbf2d23-572e-4d56-ba95-d81f55b74069	a8034fcf-21f4-49e8-a235-f33779c63ca8	ae753320-c362-4d8b-8294-53533a1a5798	t
cb17a237-4eef-4784-b5a3-8748c8c301a4	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	ae753320-c362-4d8b-8294-53533a1a5798	t
29e10d27-af04-47f1-9332-f3ad8131f9fe	3ad98109-36cd-4560-a513-86387065f22a	ae753320-c362-4d8b-8294-53533a1a5798	t
8c14088e-7ccd-4aa2-abd0-1f0e8bf74691	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	ae753320-c362-4d8b-8294-53533a1a5798	f
fdae3023-3caf-4826-bfa9-ba8f2930e088	0081c05f-e65c-46ec-8126-71e4ce15e2e4	ae753320-c362-4d8b-8294-53533a1a5798	t
cdd30faf-0244-4c38-89c7-7019d9bd48d7	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	ae753320-c362-4d8b-8294-53533a1a5798	t
4122cf96-1da6-4e59-8210-339bd3eeb358	3a698be0-2982-4e83-b1f7-84ece51e725f	ae753320-c362-4d8b-8294-53533a1a5798	f
8b11cd10-74de-4aeb-b13b-fa3fb430fd31	0db42258-ad0d-4141-9275-fd034517ec3c	ae753320-c362-4d8b-8294-53533a1a5798	f
4e23bc96-b237-43f7-822d-851ed68dd1dd	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	ae753320-c362-4d8b-8294-53533a1a5798	f
dd1b10a2-e76b-4f4a-a870-267833fe9f0e	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	ae753320-c362-4d8b-8294-53533a1a5798	f
f6677cfa-b7f8-4c92-8451-25af6597e6d4	d6d99884-3731-41d8-b516-26b1dd281f41	ae753320-c362-4d8b-8294-53533a1a5798	t
7248505b-35b7-470d-a0ac-db3a71bd4cdb	89eb4bea-11b5-423c-84ee-d938cc4c349d	ae753320-c362-4d8b-8294-53533a1a5798	t
7f959cf9-dfa2-496c-8d57-2a2316a1893c	500f45ef-8fa4-48b4-99cf-99edb720aee9	ae753320-c362-4d8b-8294-53533a1a5798	t
5dd81b7c-caab-4ce1-b372-1adfe9a430cb	a97cca97-0497-444b-8ab2-d5eb0170a835	ae753320-c362-4d8b-8294-53533a1a5798	t
d2aff793-33cd-4c4b-ad6e-ecb6735f25b2	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	ae753320-c362-4d8b-8294-53533a1a5798	t
e0eb85a7-2d48-47e2-881a-b2b7cdfd27ac	5b3f094c-3897-4fa3-adad-8469c040f013	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
7e8ac1d9-2321-4520-ab2f-929b68352271	1cf9bbfa-3ade-4997-b4de-7ec868abe610	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
d26ba016-1cbd-4d16-8ad1-ce0c8a8bebc9	5ee6f424-dea8-4ee1-bcec-f89faecf9931	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
5b05bdfd-fd31-4edc-8763-4659d8aa8d83	e0a663ac-aaa5-47cc-9e22-a9cd71853246	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
103d748a-209a-4ab9-8783-1edb12b4de1b	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
6ce68607-c37a-415b-9b64-057076e5e1ad	575a9512-8b91-4d99-a8be-f267fce026dd	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
20bf55e8-adf8-444c-b898-c69622632642	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
b493beab-53e9-4dc9-818f-f315dc9597ab	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
4aef5eca-8088-4d48-babe-23ea84b446cb	a8034fcf-21f4-49e8-a235-f33779c63ca8	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
76abbfb7-ac45-4025-bc3a-072e49154228	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
f6c34f34-d216-49fd-8ae6-375c16b03dee	3ad98109-36cd-4560-a513-86387065f22a	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
b7827ed1-9b46-4459-b655-ef6a09d57a62	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
eed15b27-a983-4781-bd08-e323015a2529	0081c05f-e65c-46ec-8126-71e4ce15e2e4	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
a4a11f70-a0b7-479d-89c0-e4b9c179fa5b	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
9b406b26-6647-479b-ad08-7a04d8f7fed5	3a698be0-2982-4e83-b1f7-84ece51e725f	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
b238c336-0ab6-41ac-8302-92e50fbb52fa	0db42258-ad0d-4141-9275-fd034517ec3c	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
856462a6-4cdb-4677-b3dc-5606fbcf3ae8	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
c4a061eb-7e10-4410-a924-649f9de98a39	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
136450fd-8e37-42e8-b8e5-1a2e4ff08cb0	d6d99884-3731-41d8-b516-26b1dd281f41	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
3895e274-aea3-4933-b6bc-dd317e048b11	89eb4bea-11b5-423c-84ee-d938cc4c349d	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
73105547-e49c-4896-a784-cd0b97bb1807	500f45ef-8fa4-48b4-99cf-99edb720aee9	f1719575-4aea-4b3e-a61c-b8307ccf9516	f
a87bcd3e-dbbb-40e3-a392-5cbf48f93142	a97cca97-0497-444b-8ab2-d5eb0170a835	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
161f75dc-c897-4bee-bbec-c15e18fcce4c	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	f1719575-4aea-4b3e-a61c-b8307ccf9516	t
a0b06cc8-8fcd-4768-a866-e6be27fe3e39	5b3f094c-3897-4fa3-adad-8469c040f013	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
d2b3480f-506d-43c3-8cbc-d6daf45bbaae	1cf9bbfa-3ade-4997-b4de-7ec868abe610	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
0869feea-705b-46c0-a95b-aeead5f4b4cb	5ee6f424-dea8-4ee1-bcec-f89faecf9931	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
2a9d1e61-f7d1-4f04-8f86-e4ea6a8aa782	e0a663ac-aaa5-47cc-9e22-a9cd71853246	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
5fdfa154-8645-4ff5-a67f-a8b20cd1cd90	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
1a33b03b-fddb-4c27-9ab5-29889d0c6dd6	575a9512-8b91-4d99-a8be-f267fce026dd	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
da99afa8-3ec9-40f5-9e7c-87d71b9a7ab0	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
e55a2eef-e6ab-4045-b243-fd887ac40809	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
2ef95020-c960-4bc8-bb9b-03b9594a58b4	a8034fcf-21f4-49e8-a235-f33779c63ca8	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
e108d17e-657e-4408-b63f-7acf852ecc04	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
4ea2d307-365e-467e-8a58-f29812015b75	3ad98109-36cd-4560-a513-86387065f22a	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
28d039b6-9736-46c0-8e97-ee78af8bd938	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
56144f0c-75c5-4cd3-8014-8ae573fe98a7	0081c05f-e65c-46ec-8126-71e4ce15e2e4	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
39dc5008-3edd-4bce-80bc-b10374a0ba24	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
7226aedd-9067-45b3-9ec8-14cdd7272ea1	3a698be0-2982-4e83-b1f7-84ece51e725f	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
06f8e9ec-7138-4aa5-851c-53a073ab07ca	0db42258-ad0d-4141-9275-fd034517ec3c	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
8dd47eb6-8553-477c-9941-5535bf8c83c2	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
0fffdee1-0bbc-49e8-8fe3-badd04483828	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
4aecd9e1-8aec-43d3-948b-4b8798d6cec3	d6d99884-3731-41d8-b516-26b1dd281f41	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
35fd6197-e2de-4552-ad3f-9d9941881139	89eb4bea-11b5-423c-84ee-d938cc4c349d	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
211303f0-b2ec-46b7-a508-f74436308605	500f45ef-8fa4-48b4-99cf-99edb720aee9	128691dd-ff65-43d8-8bf4-bb59e2e58617	f
d956b620-970b-4aee-8f52-bf4eaf401f16	a97cca97-0497-444b-8ab2-d5eb0170a835	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
2d01f8f2-acbf-4019-a22b-9d16119e2676	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	128691dd-ff65-43d8-8bf4-bb59e2e58617	t
944b7e76-c003-400e-b929-5874828a7051	5b3f094c-3897-4fa3-adad-8469c040f013	65ef7119-ea28-4a7a-9329-fcef962e4343	f
94b9f38e-adda-4c26-b371-10380b724b91	1cf9bbfa-3ade-4997-b4de-7ec868abe610	65ef7119-ea28-4a7a-9329-fcef962e4343	t
25cd1e12-aa7c-4345-b413-05e21c71a1bc	5ee6f424-dea8-4ee1-bcec-f89faecf9931	65ef7119-ea28-4a7a-9329-fcef962e4343	t
9cc79430-a4d9-4dc4-966a-73e0ab387435	e0a663ac-aaa5-47cc-9e22-a9cd71853246	65ef7119-ea28-4a7a-9329-fcef962e4343	t
f452369e-23ae-4169-9c7c-94c559daf74e	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	65ef7119-ea28-4a7a-9329-fcef962e4343	t
8b719d5c-4350-4b8f-8db8-e52e56976574	575a9512-8b91-4d99-a8be-f267fce026dd	65ef7119-ea28-4a7a-9329-fcef962e4343	t
537c2460-d256-47da-90d9-c83219a78d26	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	65ef7119-ea28-4a7a-9329-fcef962e4343	t
3625e054-adee-4717-a267-c9822a2f755f	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	65ef7119-ea28-4a7a-9329-fcef962e4343	f
4a32654b-151e-41d1-a2df-334a15ca08ab	a8034fcf-21f4-49e8-a235-f33779c63ca8	65ef7119-ea28-4a7a-9329-fcef962e4343	t
d0d6ffff-94ac-491c-8ea6-d04f23dcdfc0	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	65ef7119-ea28-4a7a-9329-fcef962e4343	f
94dc1d8e-f56e-4db8-92eb-9931e4cc7777	3ad98109-36cd-4560-a513-86387065f22a	65ef7119-ea28-4a7a-9329-fcef962e4343	t
14ab9482-8c10-470a-b943-0a954d5286c5	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	65ef7119-ea28-4a7a-9329-fcef962e4343	t
d7d82f38-a46a-453e-88ba-0503d5ec15b8	0081c05f-e65c-46ec-8126-71e4ce15e2e4	65ef7119-ea28-4a7a-9329-fcef962e4343	t
cd73b0c6-b7bf-438e-bf99-35203b4a7928	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	65ef7119-ea28-4a7a-9329-fcef962e4343	f
f3d7fa54-e79f-4217-8946-df768304e318	3a698be0-2982-4e83-b1f7-84ece51e725f	65ef7119-ea28-4a7a-9329-fcef962e4343	t
e0f91031-075f-40ff-8d6c-ada4c44fc9d1	0db42258-ad0d-4141-9275-fd034517ec3c	65ef7119-ea28-4a7a-9329-fcef962e4343	f
e2582314-ffac-4d1c-ad09-67b60acfe632	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	65ef7119-ea28-4a7a-9329-fcef962e4343	f
edd53681-577e-4d7c-903c-22f2f9f71e18	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	65ef7119-ea28-4a7a-9329-fcef962e4343	f
185fa62d-0615-4e63-a783-d7f7504dea20	d6d99884-3731-41d8-b516-26b1dd281f41	65ef7119-ea28-4a7a-9329-fcef962e4343	f
d90716bb-ffd0-42b4-9d51-6610a6d143e0	89eb4bea-11b5-423c-84ee-d938cc4c349d	65ef7119-ea28-4a7a-9329-fcef962e4343	f
5103c902-0df7-4f97-b732-2a7fad32199b	500f45ef-8fa4-48b4-99cf-99edb720aee9	65ef7119-ea28-4a7a-9329-fcef962e4343	t
e01006e7-e3bc-4c05-9f13-16fbbe110c19	a97cca97-0497-444b-8ab2-d5eb0170a835	65ef7119-ea28-4a7a-9329-fcef962e4343	t
578f5d01-573c-4f77-bb28-792ebd182a8c	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	65ef7119-ea28-4a7a-9329-fcef962e4343	t
796dca70-6d1d-4b82-bd78-8da9d2315117	5b3f094c-3897-4fa3-adad-8469c040f013	c1c97976-38c1-4174-b028-57b0273c7fac	f
4e7c7870-8b17-446a-8615-07f61d22cc78	1cf9bbfa-3ade-4997-b4de-7ec868abe610	c1c97976-38c1-4174-b028-57b0273c7fac	t
27d2f2ca-5cdb-42bd-acc3-ebc085bd42bb	5ee6f424-dea8-4ee1-bcec-f89faecf9931	c1c97976-38c1-4174-b028-57b0273c7fac	f
d28e4f5a-1460-4ed4-bdb6-3437fbe7def7	e0a663ac-aaa5-47cc-9e22-a9cd71853246	c1c97976-38c1-4174-b028-57b0273c7fac	t
cb63fe53-dbfb-4a57-a9a2-4118a53cf267	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	c1c97976-38c1-4174-b028-57b0273c7fac	f
179d3663-d5c0-40ba-ae54-2db7c9e43ec2	575a9512-8b91-4d99-a8be-f267fce026dd	c1c97976-38c1-4174-b028-57b0273c7fac	t
91b6d795-4137-46f6-81f2-860b610c680f	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	c1c97976-38c1-4174-b028-57b0273c7fac	t
dbf64c61-d759-4bbf-bfcc-e93ebb822273	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	c1c97976-38c1-4174-b028-57b0273c7fac	f
d1e46121-53c9-44fd-8fb7-c7770768318f	a8034fcf-21f4-49e8-a235-f33779c63ca8	c1c97976-38c1-4174-b028-57b0273c7fac	t
c8dadf18-ed53-45f5-a6ca-7baeb93d14de	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	c1c97976-38c1-4174-b028-57b0273c7fac	t
e12b6956-fdce-4a40-be1e-477fa381f924	3ad98109-36cd-4560-a513-86387065f22a	c1c97976-38c1-4174-b028-57b0273c7fac	t
4521996b-8cdb-4a92-9239-f246032cd38d	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	c1c97976-38c1-4174-b028-57b0273c7fac	t
439dddfe-e6a2-436f-af75-491402033baa	0081c05f-e65c-46ec-8126-71e4ce15e2e4	c1c97976-38c1-4174-b028-57b0273c7fac	f
d8653b61-8a77-44c3-95a6-84c0d1e2467b	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	c1c97976-38c1-4174-b028-57b0273c7fac	f
dff709d0-0eb6-4aea-87c2-37cf77696b8b	3a698be0-2982-4e83-b1f7-84ece51e725f	c1c97976-38c1-4174-b028-57b0273c7fac	t
4379db21-14d6-4b3a-815f-6a40b3de126c	0db42258-ad0d-4141-9275-fd034517ec3c	c1c97976-38c1-4174-b028-57b0273c7fac	f
b4c288e1-8592-4ba3-a1cd-9961ddf92d8a	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	c1c97976-38c1-4174-b028-57b0273c7fac	f
45e9116b-10a8-47a1-a7ca-90b4ae6887a6	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	c1c97976-38c1-4174-b028-57b0273c7fac	f
9525119d-f5ba-4578-9980-f4cd2ac4ecce	d6d99884-3731-41d8-b516-26b1dd281f41	c1c97976-38c1-4174-b028-57b0273c7fac	f
f2de995c-a12c-4866-8d2f-b190d9400216	89eb4bea-11b5-423c-84ee-d938cc4c349d	c1c97976-38c1-4174-b028-57b0273c7fac	t
c1b83819-f530-4ef3-ae42-9ed0199694d6	500f45ef-8fa4-48b4-99cf-99edb720aee9	c1c97976-38c1-4174-b028-57b0273c7fac	f
227af95c-0b74-4a08-adff-361c4debeae2	a97cca97-0497-444b-8ab2-d5eb0170a835	c1c97976-38c1-4174-b028-57b0273c7fac	t
76de3a5c-e256-404b-a194-a547a1db3e3b	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	c1c97976-38c1-4174-b028-57b0273c7fac	t
6671090f-645c-402e-ada6-ecf7da524d14	5b3f094c-3897-4fa3-adad-8469c040f013	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
b557b27e-1a0f-48c5-92c8-22a81092b364	1cf9bbfa-3ade-4997-b4de-7ec868abe610	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
fcd9ea2a-1d55-4432-b4be-15c76e9f076f	5ee6f424-dea8-4ee1-bcec-f89faecf9931	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
f6dba5a4-729a-41ba-9791-1f9519d8d820	e0a663ac-aaa5-47cc-9e22-a9cd71853246	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
c98eea22-7cf2-4f8b-ae39-43e153ccac1d	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
c50cfeaa-1f83-40b3-98f9-4a667179cab9	575a9512-8b91-4d99-a8be-f267fce026dd	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
92692d9d-66df-4c85-b917-931f65a094a7	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
68f3f6fa-7f9d-4268-afa1-2ae523f7f666	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
ffc6ea6e-e878-4863-9d72-95db1c925933	a8034fcf-21f4-49e8-a235-f33779c63ca8	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
b58a099d-7e67-4429-8e07-4e3522a7a698	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
e432387d-817d-4a93-a4d2-543e9a354442	3ad98109-36cd-4560-a513-86387065f22a	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
519c436b-43b1-41d3-9a78-beac76d36522	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
75b0405c-4c99-4cf6-8458-f5829b71c013	0081c05f-e65c-46ec-8126-71e4ce15e2e4	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
feff1552-af58-4fdb-a440-3dabc9e558c8	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
0176ca86-5924-487d-835f-d9d2aedfc1fe	3a698be0-2982-4e83-b1f7-84ece51e725f	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
5b2b568b-edcf-4744-abdb-a240677aa72b	0db42258-ad0d-4141-9275-fd034517ec3c	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
d7d321a9-13e3-4548-bbad-9e407fd94bca	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
7a2e7a2a-ed84-4f00-8772-1e17aa01e860	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
b25b6c62-aeff-4932-9db5-8ab5a59f2232	d6d99884-3731-41d8-b516-26b1dd281f41	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
8510efa1-6aa8-4cc4-9530-f2c31e39d27f	89eb4bea-11b5-423c-84ee-d938cc4c349d	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
e3c14b2d-e446-4c8f-80d6-c8559e63ebb6	500f45ef-8fa4-48b4-99cf-99edb720aee9	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
b0bdf3be-72f4-43ac-a80d-454aba6dc433	a97cca97-0497-444b-8ab2-d5eb0170a835	fd519d52-433b-4bf7-8e7d-e18caeccf843	f
13f2d80f-23ca-4c77-849b-d9735d2ddd1a	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	fd519d52-433b-4bf7-8e7d-e18caeccf843	t
c43b1019-fa50-4605-89af-c478a85506ef	5b3f094c-3897-4fa3-adad-8469c040f013	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
d3e897c3-304f-49e4-a435-ecddffa1e7e1	1cf9bbfa-3ade-4997-b4de-7ec868abe610	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
bee16eb1-57a4-4590-9e3f-b433bd6ee47c	5ee6f424-dea8-4ee1-bcec-f89faecf9931	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
f1736169-9cee-4dc0-b22d-8d6dbf6b7d57	e0a663ac-aaa5-47cc-9e22-a9cd71853246	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
fe15efcd-3068-4943-813f-3875d2acbe94	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
78dde1e4-005e-4016-94ef-027c79e207a2	575a9512-8b91-4d99-a8be-f267fce026dd	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
fec511aa-7c75-4556-a99f-e84e1c020658	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
22c86883-6381-46ee-a43b-d73db4e4a16d	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
75de9388-9baf-4ab1-89ba-f99ff538dc84	a8034fcf-21f4-49e8-a235-f33779c63ca8	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
f24a862a-87eb-40e9-9787-904294b6c027	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
29bd03f4-950e-411c-9457-dc4496a9c1c3	3ad98109-36cd-4560-a513-86387065f22a	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
d6aac537-c14b-4230-9492-fc4ac3b6a280	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
467aa40e-3392-4378-9af3-88be23f5c0f7	0081c05f-e65c-46ec-8126-71e4ce15e2e4	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
3ef440f1-e85c-4b03-b9ef-7de7835fa2d7	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
dc19c09b-b642-4e51-8066-84573a0975c6	3a698be0-2982-4e83-b1f7-84ece51e725f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
73919fa7-5ed7-4600-9458-6c3cdf9ebeeb	0db42258-ad0d-4141-9275-fd034517ec3c	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
770bc33d-9510-48c4-8a7c-a0603ea8e6e4	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
8b838362-3de2-4654-bd2e-e952e708d2e1	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
651e22f3-8550-4b0e-8595-917a98b61bcc	d6d99884-3731-41d8-b516-26b1dd281f41	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
ff64b83c-5cda-42cb-8d67-560eccbb0c21	89eb4bea-11b5-423c-84ee-d938cc4c349d	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
217124dd-e46c-4d6f-b09e-39aa0bfd1ad2	500f45ef-8fa4-48b4-99cf-99edb720aee9	f3575bed-7b01-4358-bdf2-3d1f81cc2515	f
5f45c0cf-ffc3-45f9-bcaa-e4d912c815ed	a97cca97-0497-444b-8ab2-d5eb0170a835	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
cc2e9586-7ce9-40da-b4c2-53b973778ff5	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	t
e93e7f3c-6e22-479b-a110-96c970e20af5	5b3f094c-3897-4fa3-adad-8469c040f013	95465124-34e6-4104-95f7-2f6289016331	f
4acf2d9a-0ead-4571-88ff-aa39801acbea	1cf9bbfa-3ade-4997-b4de-7ec868abe610	95465124-34e6-4104-95f7-2f6289016331	t
acd37b22-d8b0-496c-9c09-667a1514cf59	5ee6f424-dea8-4ee1-bcec-f89faecf9931	95465124-34e6-4104-95f7-2f6289016331	t
f262c6fd-e47c-4d44-91ed-e6d076dd4492	e0a663ac-aaa5-47cc-9e22-a9cd71853246	95465124-34e6-4104-95f7-2f6289016331	t
a000859a-bdcc-47a4-9e8f-67cdcd3a94fc	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	95465124-34e6-4104-95f7-2f6289016331	t
66791cf6-9730-40b5-bcab-d281f874cd25	575a9512-8b91-4d99-a8be-f267fce026dd	95465124-34e6-4104-95f7-2f6289016331	t
6edda843-5041-48d2-9dbb-4f01c917658e	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	95465124-34e6-4104-95f7-2f6289016331	t
b641b54c-8e38-4091-b4b4-32b96497716d	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	95465124-34e6-4104-95f7-2f6289016331	t
58c2bd24-4383-4c98-92ef-5d04f40a2272	a8034fcf-21f4-49e8-a235-f33779c63ca8	95465124-34e6-4104-95f7-2f6289016331	t
1dc617a9-25e3-490e-b694-391b747d26f3	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	95465124-34e6-4104-95f7-2f6289016331	t
126681fe-8642-4b13-99f0-0bc3ebcb9069	3ad98109-36cd-4560-a513-86387065f22a	95465124-34e6-4104-95f7-2f6289016331	t
975c23f8-82b2-4992-8e76-5b4c5ad06d78	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	95465124-34e6-4104-95f7-2f6289016331	t
030f66b3-fec8-4066-a8f0-29fa4ccfda4d	0081c05f-e65c-46ec-8126-71e4ce15e2e4	95465124-34e6-4104-95f7-2f6289016331	t
69074343-8d80-47b0-8b04-cb4ab91c3cfd	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	95465124-34e6-4104-95f7-2f6289016331	t
75b610b5-6644-46e9-aa27-0c274bee44bb	3a698be0-2982-4e83-b1f7-84ece51e725f	95465124-34e6-4104-95f7-2f6289016331	f
518a8aa7-fcd7-48c5-9937-71e3d3cddc3b	0db42258-ad0d-4141-9275-fd034517ec3c	95465124-34e6-4104-95f7-2f6289016331	f
10ee1af0-681e-4561-aba2-271c8bf490cf	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	95465124-34e6-4104-95f7-2f6289016331	t
bf675cde-0591-4aa4-8962-ed14834e55b5	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	95465124-34e6-4104-95f7-2f6289016331	t
611542d1-e230-4e85-a51e-75b4a1a96692	d6d99884-3731-41d8-b516-26b1dd281f41	95465124-34e6-4104-95f7-2f6289016331	t
8559e284-3e2e-4297-8f46-26a166a7e541	89eb4bea-11b5-423c-84ee-d938cc4c349d	95465124-34e6-4104-95f7-2f6289016331	f
55964a44-53c3-4b58-acbb-3e2795d68691	500f45ef-8fa4-48b4-99cf-99edb720aee9	95465124-34e6-4104-95f7-2f6289016331	f
3021dd9e-9612-4d5f-adf7-89fdce25a750	a97cca97-0497-444b-8ab2-d5eb0170a835	95465124-34e6-4104-95f7-2f6289016331	t
13c26f54-8e87-400e-8a46-429042fc8894	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	95465124-34e6-4104-95f7-2f6289016331	t
064f4428-2024-4e66-bdad-0c36e7b9cbca	5b3f094c-3897-4fa3-adad-8469c040f013	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
224bdd89-ceff-4779-98f9-9685d1b4119e	1cf9bbfa-3ade-4997-b4de-7ec868abe610	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
22ad8c64-beef-4cc9-ae11-6b0f41bd78d3	5ee6f424-dea8-4ee1-bcec-f89faecf9931	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
873ec877-b86f-4753-a9a8-41215127b65d	e0a663ac-aaa5-47cc-9e22-a9cd71853246	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
77b31c33-e980-41bb-8254-7daa81a456e1	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
48263a19-ba07-4574-a2f1-ecb70a9cd513	575a9512-8b91-4d99-a8be-f267fce026dd	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
de24189d-1434-4ddb-8c28-ba2a81f50453	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
f5e1f12d-f382-4504-8a3f-e5e6e1ef9baa	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
c7e84e97-d7e8-4cf6-b83c-824f42a5fc03	a8034fcf-21f4-49e8-a235-f33779c63ca8	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
0e793b5c-62bb-44b4-aca6-cb46d9ce9b04	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
bae26f1e-6911-4381-b02f-5fc9057cfb34	3ad98109-36cd-4560-a513-86387065f22a	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
bc1db764-48bf-4763-bca3-40ef04abfa39	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
2c7aa994-8164-47b3-8e72-38faaa2241b4	0081c05f-e65c-46ec-8126-71e4ce15e2e4	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
a6d8dfae-6379-4d26-8323-d5a9ecab2313	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
40560647-fbe5-44a4-bc4c-c6493b0e36fe	3a698be0-2982-4e83-b1f7-84ece51e725f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
c309358f-7326-4825-810e-ac9c986113f8	0db42258-ad0d-4141-9275-fd034517ec3c	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
ee1c5cde-00a1-4d67-bbf4-3d31af0e818e	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
733d0959-10a7-4496-b747-e78b03f2f17d	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
de476e9c-8399-47d4-a430-9c81c3417485	d6d99884-3731-41d8-b516-26b1dd281f41	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
003c128e-0123-41fb-81be-696cf694906d	89eb4bea-11b5-423c-84ee-d938cc4c349d	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
5d21f77d-a6c3-4a1f-b2fc-73f98bdede59	500f45ef-8fa4-48b4-99cf-99edb720aee9	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
deb7638d-8a8f-43d7-b876-29e2822b44bd	a97cca97-0497-444b-8ab2-d5eb0170a835	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	f
609c4b35-2433-4af2-9dd2-8c369791750c	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	t
fdc155ed-8679-41e8-ab37-b3a09632358c	5b3f094c-3897-4fa3-adad-8469c040f013	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
ee6128da-843f-4391-8d7a-7fdbea69c797	1cf9bbfa-3ade-4997-b4de-7ec868abe610	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
555c71cc-f85e-4be3-8576-44ed4f9a2c29	5ee6f424-dea8-4ee1-bcec-f89faecf9931	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
d7c25066-892a-4c69-83a3-98d02790ffe7	e0a663ac-aaa5-47cc-9e22-a9cd71853246	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
35de2464-4b10-41cb-8817-079c3be65250	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
0b04bd6e-458d-41b8-b7b6-a40b205707be	575a9512-8b91-4d99-a8be-f267fce026dd	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
c1f956a1-8738-4df0-bb39-60edcdbfb2e7	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
53dd4d9a-a3f6-484c-9453-20a42e202a78	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	f
667d9779-af92-4142-b09c-19a088f165ac	a8034fcf-21f4-49e8-a235-f33779c63ca8	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
37d95bbf-f704-44a4-87ed-af05e141d918	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
4aea9317-5d35-49e0-8070-779a41c0ebe3	3ad98109-36cd-4560-a513-86387065f22a	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
d279dde0-3455-487b-a383-efe5ba1f850b	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
942cccf1-8aa8-41a6-bce7-f7160b4b8ee6	0081c05f-e65c-46ec-8126-71e4ce15e2e4	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
cf330c6d-c8b8-4582-a02b-36b5ad06c53d	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
7474515b-4d99-432b-a0c1-1ae48fdab8d2	3a698be0-2982-4e83-b1f7-84ece51e725f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
c93f448e-ae3a-4d91-b04f-cf487d5ab78f	0db42258-ad0d-4141-9275-fd034517ec3c	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
fdf21dfa-3001-4ddf-9d78-fb5c392f1ed0	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
4a19ae56-ad64-44a5-b4a7-77e325ff2632	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
19150d4a-596f-4076-b824-4c2a1ac9ff1d	d6d99884-3731-41d8-b516-26b1dd281f41	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
3be2ec41-f6b5-40af-bad4-23423ff75de9	89eb4bea-11b5-423c-84ee-d938cc4c349d	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
103909ae-0c75-4e1a-ae13-41e63a2a91e8	500f45ef-8fa4-48b4-99cf-99edb720aee9	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
ee91d144-844d-40ad-a262-e7537c0794b6	a97cca97-0497-444b-8ab2-d5eb0170a835	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
fe820a07-024b-44f6-b29d-7aab3dd09c3e	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	t
d294e746-0feb-4d55-9324-a72687825b12	5b3f094c-3897-4fa3-adad-8469c040f013	a78272dc-151f-400f-a0b4-1eeec317739c	t
67ae673c-3b8c-46dd-bce4-84893fede057	1cf9bbfa-3ade-4997-b4de-7ec868abe610	a78272dc-151f-400f-a0b4-1eeec317739c	f
8ac839d2-1cf8-42ef-9539-41183bccc6b1	5ee6f424-dea8-4ee1-bcec-f89faecf9931	a78272dc-151f-400f-a0b4-1eeec317739c	f
bb42c4f6-ee9a-47f0-aebe-20de263f6d74	e0a663ac-aaa5-47cc-9e22-a9cd71853246	a78272dc-151f-400f-a0b4-1eeec317739c	f
d470320d-ac6e-4146-abea-e9c4b7d409ec	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	a78272dc-151f-400f-a0b4-1eeec317739c	f
ef8748ed-15af-46d5-b334-197d6be98de3	575a9512-8b91-4d99-a8be-f267fce026dd	a78272dc-151f-400f-a0b4-1eeec317739c	f
61a7070a-2d3a-4137-a201-1c9733973475	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	a78272dc-151f-400f-a0b4-1eeec317739c	f
9eafb232-2cce-4c41-8a53-34800bbde211	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	a78272dc-151f-400f-a0b4-1eeec317739c	f
0b498ffc-b996-4a2e-a4e4-abfd9a7f461a	a8034fcf-21f4-49e8-a235-f33779c63ca8	a78272dc-151f-400f-a0b4-1eeec317739c	t
eff7e692-f881-497e-af37-5ac5b201da81	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	a78272dc-151f-400f-a0b4-1eeec317739c	t
081ef861-5b6a-4c79-8b5c-15cc2691f27e	3ad98109-36cd-4560-a513-86387065f22a	a78272dc-151f-400f-a0b4-1eeec317739c	t
5518194f-6954-43a2-99de-b45fe43fe64f	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	a78272dc-151f-400f-a0b4-1eeec317739c	t
45c2f552-fde8-4991-8e23-6dbeaca77d12	0081c05f-e65c-46ec-8126-71e4ce15e2e4	a78272dc-151f-400f-a0b4-1eeec317739c	t
c0bf2e67-e961-4706-a8f2-bb12f90dff7b	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	a78272dc-151f-400f-a0b4-1eeec317739c	t
edee842e-fc1e-4f93-a969-5f3992719a64	3a698be0-2982-4e83-b1f7-84ece51e725f	a78272dc-151f-400f-a0b4-1eeec317739c	t
81620e20-276b-4525-8201-153250643f5f	0db42258-ad0d-4141-9275-fd034517ec3c	a78272dc-151f-400f-a0b4-1eeec317739c	t
93a4af93-8207-4e47-9539-a9e69696160d	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	a78272dc-151f-400f-a0b4-1eeec317739c	t
d27eebf9-a03c-4c81-91d4-892b7a256556	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	a78272dc-151f-400f-a0b4-1eeec317739c	t
b74cc6f8-c0df-47b4-a271-12b5ed3198e7	d6d99884-3731-41d8-b516-26b1dd281f41	a78272dc-151f-400f-a0b4-1eeec317739c	t
1a970d96-8118-401f-b03f-e98079f081a2	89eb4bea-11b5-423c-84ee-d938cc4c349d	a78272dc-151f-400f-a0b4-1eeec317739c	t
34726432-644e-4f42-93fa-6db05e8f05d0	500f45ef-8fa4-48b4-99cf-99edb720aee9	a78272dc-151f-400f-a0b4-1eeec317739c	t
38eaf834-fef5-4ec1-a12d-e0d105901d9b	a97cca97-0497-444b-8ab2-d5eb0170a835	a78272dc-151f-400f-a0b4-1eeec317739c	t
fca1c158-382e-4d2d-86be-81ebb822612d	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	a78272dc-151f-400f-a0b4-1eeec317739c	t
087b2b92-c192-4cd9-8f7d-15bc2ba55bb7	5b3f094c-3897-4fa3-adad-8469c040f013	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
a3bafda9-1eb8-4214-9f09-2306d307faf7	1cf9bbfa-3ade-4997-b4de-7ec868abe610	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
ce38ed88-30a9-4591-bbf1-21209d3ffed1	5ee6f424-dea8-4ee1-bcec-f89faecf9931	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
1aa7525e-866e-48f0-b0c8-7699180756d9	e0a663ac-aaa5-47cc-9e22-a9cd71853246	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
255d2002-cd16-4583-be64-c160323926da	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
88ff4838-4b1e-4bc8-9364-ba23b3f0c584	575a9512-8b91-4d99-a8be-f267fce026dd	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
b30b9faa-e22f-4ec5-8d81-33dab5acd997	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
caf4a14c-5fa8-4eba-b35f-aeb0ef9612e0	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
734eabcb-9f32-47f7-968c-957b0a0a77e5	a8034fcf-21f4-49e8-a235-f33779c63ca8	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
ed5b95ac-8b94-45a5-b238-bba09b249695	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
062cef48-591b-468a-8c35-5953eec913b8	3ad98109-36cd-4560-a513-86387065f22a	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
6c33438b-c958-45bf-b93c-6c63df770d64	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
b3a0f2bd-0b09-40a0-bf6b-a63825cf064b	0081c05f-e65c-46ec-8126-71e4ce15e2e4	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
679adb64-4c7d-4a53-a369-8debc2a952a0	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
04815dab-58d6-431a-b2bc-f674d2d6bae6	3a698be0-2982-4e83-b1f7-84ece51e725f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
d91d63ee-f9f6-4aee-880d-d49afba101e0	0db42258-ad0d-4141-9275-fd034517ec3c	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
a06c75b2-042f-4e5f-9ab7-236a6befe795	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
25763cbf-dbcf-48e5-bcd6-934600bc49b8	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
4583ea37-cdf3-4adc-b274-9297fbc84ff2	d6d99884-3731-41d8-b516-26b1dd281f41	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
e2137f14-3f71-4794-9e82-109d839da233	89eb4bea-11b5-423c-84ee-d938cc4c349d	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
7a30287d-107c-4d3b-b537-04af17051b30	500f45ef-8fa4-48b4-99cf-99edb720aee9	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
29cd5f7a-3bdb-4817-a2e4-9bbaf75fbe97	a97cca97-0497-444b-8ab2-d5eb0170a835	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	f
e7203cfd-13c1-47ee-a15e-90c1731e5693	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	t
d4658aba-a605-4a47-adc0-6ae33e8746db	5b3f094c-3897-4fa3-adad-8469c040f013	47d8c413-5440-4d05-90cb-0757217fdfaf	t
8a4898e0-805b-4411-b80c-8364d162e810	1cf9bbfa-3ade-4997-b4de-7ec868abe610	47d8c413-5440-4d05-90cb-0757217fdfaf	f
3ba5f8d4-c886-4b91-add0-f83334eda009	5ee6f424-dea8-4ee1-bcec-f89faecf9931	47d8c413-5440-4d05-90cb-0757217fdfaf	f
5a9ef72c-d801-45a9-95a2-fd7b3a50e579	e0a663ac-aaa5-47cc-9e22-a9cd71853246	47d8c413-5440-4d05-90cb-0757217fdfaf	f
ebae6c55-2e61-4262-9352-ac7df37c3e12	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	47d8c413-5440-4d05-90cb-0757217fdfaf	f
b64f2456-e214-4eed-b8fc-f7d4e4168005	575a9512-8b91-4d99-a8be-f267fce026dd	47d8c413-5440-4d05-90cb-0757217fdfaf	f
f08898c8-0621-4f38-8532-0ea79504e7bc	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	47d8c413-5440-4d05-90cb-0757217fdfaf	f
bd712488-2e1b-4b71-b8e4-7af54dd22b01	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	47d8c413-5440-4d05-90cb-0757217fdfaf	f
601d4deb-4fea-4068-890c-246104143552	a8034fcf-21f4-49e8-a235-f33779c63ca8	47d8c413-5440-4d05-90cb-0757217fdfaf	t
b7cd9502-59c2-4af9-93f0-3f3db6a432b0	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	47d8c413-5440-4d05-90cb-0757217fdfaf	t
ab3fef2d-05eb-4435-8c8f-db6959dad91c	3ad98109-36cd-4560-a513-86387065f22a	47d8c413-5440-4d05-90cb-0757217fdfaf	t
57aac67c-72d3-4a32-af70-d128fb918b4f	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	47d8c413-5440-4d05-90cb-0757217fdfaf	t
b55578db-0744-4eb9-885f-cf8753a22993	0081c05f-e65c-46ec-8126-71e4ce15e2e4	47d8c413-5440-4d05-90cb-0757217fdfaf	t
da788440-712f-4a2b-a92b-75dca79fb28c	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	47d8c413-5440-4d05-90cb-0757217fdfaf	t
d3bcd3b6-cd91-4e03-aa65-cb98090b6a03	3a698be0-2982-4e83-b1f7-84ece51e725f	47d8c413-5440-4d05-90cb-0757217fdfaf	t
e61be740-5bc1-4dd7-b7d3-c29058769475	0db42258-ad0d-4141-9275-fd034517ec3c	47d8c413-5440-4d05-90cb-0757217fdfaf	t
c8494b2e-a861-47a6-a74b-38218cfd01a8	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	47d8c413-5440-4d05-90cb-0757217fdfaf	t
cacd2ea9-e297-4f88-9d15-3d8535a235d9	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	47d8c413-5440-4d05-90cb-0757217fdfaf	t
3c801383-ca95-4d21-b362-753a4dad4ce3	d6d99884-3731-41d8-b516-26b1dd281f41	47d8c413-5440-4d05-90cb-0757217fdfaf	t
5444bba0-4471-4a06-8efe-c69404cc62c9	89eb4bea-11b5-423c-84ee-d938cc4c349d	47d8c413-5440-4d05-90cb-0757217fdfaf	t
138c5112-5a23-4cad-a21b-7b423c188fc1	500f45ef-8fa4-48b4-99cf-99edb720aee9	47d8c413-5440-4d05-90cb-0757217fdfaf	t
2dd8442e-e383-4c37-b2a6-1892f3d5c209	a97cca97-0497-444b-8ab2-d5eb0170a835	47d8c413-5440-4d05-90cb-0757217fdfaf	t
200bb32e-a38c-456b-8c8b-080118af162d	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	47d8c413-5440-4d05-90cb-0757217fdfaf	t
39b89484-234d-4fc4-94d8-24f4b7f00e32	5b3f094c-3897-4fa3-adad-8469c040f013	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
c302a291-c711-47d2-a108-f61d2bda3b0d	1cf9bbfa-3ade-4997-b4de-7ec868abe610	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
affd798a-0c9a-4826-8956-855057b78d7c	5ee6f424-dea8-4ee1-bcec-f89faecf9931	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
a513c2b4-22f2-45c7-a9dd-35b1b7accf49	e0a663ac-aaa5-47cc-9e22-a9cd71853246	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
14accd3e-eeab-421d-a260-1d20fe08d769	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
c48f8f29-bb1f-4a01-9304-d342eea24074	575a9512-8b91-4d99-a8be-f267fce026dd	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
ae3a7079-36cc-4043-9502-84ae3a97cb42	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
955bc0fb-c643-44e1-ad9e-26b1041345f2	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
0c95749c-3552-447d-bf21-a9563fec050f	a8034fcf-21f4-49e8-a235-f33779c63ca8	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
476f2a47-aafc-4d08-80a9-7c612ef618ce	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
e9b05e7f-0874-463e-b8e2-3942170d4495	3ad98109-36cd-4560-a513-86387065f22a	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
5e3dc751-16db-4a76-8e1c-1d42edf90eb3	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
2704433d-406e-468f-8432-2c1a3c826d4a	0081c05f-e65c-46ec-8126-71e4ce15e2e4	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
caae1e8d-93a6-4023-8b55-35f54282b599	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
85ffc00f-8cbf-45d9-b6e9-f91e36398537	3a698be0-2982-4e83-b1f7-84ece51e725f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
0223c1f5-c8bc-42b5-a391-50e2b334fb0a	0db42258-ad0d-4141-9275-fd034517ec3c	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
e2e4a1b4-895c-4288-8d41-a5c8a4430833	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
b1ae580b-2a96-48eb-a39e-d91f6e54fc59	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
ac7d5dce-a359-4019-aa9a-b56394fc9931	d6d99884-3731-41d8-b516-26b1dd281f41	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
c4ae5f03-ec82-480f-8e88-ac8e477e8ed5	89eb4bea-11b5-423c-84ee-d938cc4c349d	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
ed35c37c-51b8-4726-a4f2-1fd06840b69e	500f45ef-8fa4-48b4-99cf-99edb720aee9	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
f5f3dec0-bee1-4c01-b720-edc67b761413	a97cca97-0497-444b-8ab2-d5eb0170a835	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	t
a67cde1e-79b0-404e-8ebe-fce406768a38	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	f
bbc9938a-ef94-48e6-a5ab-da4418bf0596	5b3f094c-3897-4fa3-adad-8469c040f013	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
f9e864d5-d209-4f11-bb4f-dcb1a4c52847	1cf9bbfa-3ade-4997-b4de-7ec868abe610	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
10d06e5a-26ef-4c6b-8977-fb8fc106a3d4	5ee6f424-dea8-4ee1-bcec-f89faecf9931	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
9be44783-f357-470d-b638-df764188d1ac	e0a663ac-aaa5-47cc-9e22-a9cd71853246	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
8c044635-0c54-4deb-8389-56245ee09f7f	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
b2e74c95-d002-46fc-9e76-bb136748e19c	575a9512-8b91-4d99-a8be-f267fce026dd	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
53fb8eea-b04b-4028-a161-32219fe5f7c2	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
967cd56f-7538-45ac-806f-04e88122b442	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
591191d7-f44d-4633-bc21-f352e7fb86dc	a8034fcf-21f4-49e8-a235-f33779c63ca8	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
8bdc29f4-3916-4f86-b1c5-e7bdd57f059d	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
e38234c6-a4c3-4ed6-aca9-83a786447dd0	3ad98109-36cd-4560-a513-86387065f22a	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
8c1968ee-118c-4203-a99c-cbd20abd11dc	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
45cb3a0d-e437-4862-a327-df2bd94f16e0	0081c05f-e65c-46ec-8126-71e4ce15e2e4	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
15de7167-ac65-4f45-85db-5a80db7240a2	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
57420f7d-5711-473e-abdd-1ab177c221c7	3a698be0-2982-4e83-b1f7-84ece51e725f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
dddefcec-c0e4-45fe-abea-e8fbca3734b1	0db42258-ad0d-4141-9275-fd034517ec3c	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
d646be0c-9d6b-4f8b-ac90-b29ee182292f	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
2b1a1bf7-c08e-4f6e-95e6-cb994649d4f5	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
9c06c169-e46e-4614-9ee3-cf16c5499c3b	d6d99884-3731-41d8-b516-26b1dd281f41	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
ec98eb59-3a91-4e7d-963e-17e8c341131b	89eb4bea-11b5-423c-84ee-d938cc4c349d	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
9e89e52b-4c2e-47e6-a66e-7949257ea2f1	500f45ef-8fa4-48b4-99cf-99edb720aee9	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
b6cf173a-44af-456d-aa1a-d83aba448766	a97cca97-0497-444b-8ab2-d5eb0170a835	d1dce1c9-e82b-4efb-8d22-00117a37b94a	f
2e61f476-86ff-4733-b87e-931c295d755d	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	t
b6638826-2ac2-4f47-85f8-06c849dd04b8	5b3f094c-3897-4fa3-adad-8469c040f013	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
e935ded0-42b0-4f68-817d-7628629298d5	1cf9bbfa-3ade-4997-b4de-7ec868abe610	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
9eb35c27-bf1e-496b-a961-dda3a9ecf59b	5ee6f424-dea8-4ee1-bcec-f89faecf9931	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
bf7daf86-54b4-45cb-95ae-dd54a08857bc	e0a663ac-aaa5-47cc-9e22-a9cd71853246	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
535d162f-777a-4ed1-82b7-82c5e4fdfb6b	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
7a07989f-23ae-403b-a52c-703adefb01c4	575a9512-8b91-4d99-a8be-f267fce026dd	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
ddaa7358-b549-4ab6-ac57-e9411e5d89f4	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
ec37c4ae-57b9-4ed3-b824-42ba107d463a	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
2446586a-c6a0-486a-8360-4c7f46f7aa92	a8034fcf-21f4-49e8-a235-f33779c63ca8	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
e9905394-6a0f-410f-aa83-156f7889ae2f	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
b13e3e1c-ecad-4caf-b0c0-f96b938e6d17	3ad98109-36cd-4560-a513-86387065f22a	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
8cdd917d-b0c4-4d7e-8c19-95fc506fb8f7	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
36b37cfe-ed79-443b-93f7-80446b113643	0081c05f-e65c-46ec-8126-71e4ce15e2e4	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
5b76b36a-c74c-4a24-b6e3-d53b915d6087	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
0e4d7c39-09d0-4ef4-8120-3dbfbf4eb391	3a698be0-2982-4e83-b1f7-84ece51e725f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
3483a238-6874-4504-b974-1304e7b930c1	0db42258-ad0d-4141-9275-fd034517ec3c	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
7fb04933-496d-4aa8-abec-8d5efa341baa	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
e2af92ac-175d-46fd-a717-60b1da41390c	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
46a838ad-6a60-4adb-acd7-9d518a7d7b19	d6d99884-3731-41d8-b516-26b1dd281f41	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
7670b95a-9e3f-4140-b713-5c4e307b3206	89eb4bea-11b5-423c-84ee-d938cc4c349d	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
1ded10eb-8343-4b21-b5c3-da7746f2acbe	500f45ef-8fa4-48b4-99cf-99edb720aee9	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
e9dd02d5-734f-4cbf-a36e-f413a5c39af1	a97cca97-0497-444b-8ab2-d5eb0170a835	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	f
b049e1f8-b89f-4012-bae7-3b15dfc5d645	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	t
40193957-349d-4fab-a41e-6a567496d8c3	5b3f094c-3897-4fa3-adad-8469c040f013	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
33835806-7e1b-4941-ba78-0ac91730ac1f	1cf9bbfa-3ade-4997-b4de-7ec868abe610	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
4137c852-fcf2-4d98-a6c5-bbc44ccaba1c	5ee6f424-dea8-4ee1-bcec-f89faecf9931	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
23e538c5-be52-4d1c-8637-324ac918b950	e0a663ac-aaa5-47cc-9e22-a9cd71853246	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
f2fc3f7f-efce-401f-b542-7dc096197d6a	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
282f0e91-f3fb-4627-ab73-292ed9229af3	575a9512-8b91-4d99-a8be-f267fce026dd	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
52afd803-8daa-438d-81a2-dc6c998b1031	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
cf2136e5-3e13-44e0-b969-c085a666b745	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
2c261c25-c76d-47e7-85d9-ce5c3f93d3c9	a8034fcf-21f4-49e8-a235-f33779c63ca8	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
2ddfc341-2197-4abf-b248-cf958c6a2744	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
3ca226fc-1ddb-4a20-a9b5-1e9d1582b91c	3ad98109-36cd-4560-a513-86387065f22a	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
4f6bc2ed-a9d9-4d9e-9a25-f80ba96b4bab	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
8d9587b7-6cd0-42fd-ad57-9a1e948c206c	0081c05f-e65c-46ec-8126-71e4ce15e2e4	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
9ed1c16c-9f7b-400f-8bd3-705fe6638fcc	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
2ae289bb-4e9f-423a-83f6-bbd6febdb576	3a698be0-2982-4e83-b1f7-84ece51e725f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
4e90dc8a-e3ac-418c-b6fa-24893bc3d647	0db42258-ad0d-4141-9275-fd034517ec3c	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
ac42799e-3dd4-42b9-8c08-2d8eafd94113	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
958db075-fef2-4926-b86a-df450598d17b	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
19e963bc-a483-45fb-8008-93d8721a96fe	d6d99884-3731-41d8-b516-26b1dd281f41	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
b37195fd-9d2b-4a50-843d-6e16ae0c403b	89eb4bea-11b5-423c-84ee-d938cc4c349d	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
c9914ab6-8e89-4419-bb04-7bbf835c2b92	500f45ef-8fa4-48b4-99cf-99edb720aee9	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
293d6ec4-672d-47c4-9741-42aff21a5873	a97cca97-0497-444b-8ab2-d5eb0170a835	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
942f552e-7b97-4ed5-9947-f8cd9197d952	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	t
5be16a4c-e68e-4950-95ad-f9ceb4e45e70	5b3f094c-3897-4fa3-adad-8469c040f013	e79979e1-326f-4b84-b613-ce32953d1f05	t
8e4a19cb-6cfc-4ae9-8655-52f9b4b60502	1cf9bbfa-3ade-4997-b4de-7ec868abe610	e79979e1-326f-4b84-b613-ce32953d1f05	t
f08845a7-b4c7-43cd-acdf-72ae856d7d73	5ee6f424-dea8-4ee1-bcec-f89faecf9931	e79979e1-326f-4b84-b613-ce32953d1f05	t
1a81453d-d94e-402f-a9f4-e910e764e54e	e0a663ac-aaa5-47cc-9e22-a9cd71853246	e79979e1-326f-4b84-b613-ce32953d1f05	t
8da11b2b-cfb3-48b1-a442-f365248b4ad3	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	e79979e1-326f-4b84-b613-ce32953d1f05	t
2f470667-8b9e-4d06-80ef-b946b9883b8f	575a9512-8b91-4d99-a8be-f267fce026dd	e79979e1-326f-4b84-b613-ce32953d1f05	t
2a3df4f3-4508-4736-a187-1f3e1f8312ed	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	e79979e1-326f-4b84-b613-ce32953d1f05	t
5a1b5480-9916-4233-9759-3be8cc56cd17	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	e79979e1-326f-4b84-b613-ce32953d1f05	t
dec4cfd1-aea6-4aef-b2e7-ad3d45d5ed32	a8034fcf-21f4-49e8-a235-f33779c63ca8	e79979e1-326f-4b84-b613-ce32953d1f05	t
930380e3-b487-49af-99a2-aba54dac326e	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	e79979e1-326f-4b84-b613-ce32953d1f05	t
eb5848e6-a31b-4d53-9187-d32bea4a287a	3ad98109-36cd-4560-a513-86387065f22a	e79979e1-326f-4b84-b613-ce32953d1f05	t
bf8e84ba-d7d8-44cb-a0c8-84d126f498c5	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	e79979e1-326f-4b84-b613-ce32953d1f05	t
173ef345-2376-4110-af23-b491994c04a1	0081c05f-e65c-46ec-8126-71e4ce15e2e4	e79979e1-326f-4b84-b613-ce32953d1f05	t
b89aacfb-04c4-40fd-bf63-a33610900d04	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	e79979e1-326f-4b84-b613-ce32953d1f05	t
0494f4a4-a6e2-48fd-bd93-c7cbc483117f	3a698be0-2982-4e83-b1f7-84ece51e725f	e79979e1-326f-4b84-b613-ce32953d1f05	t
ff84621e-f313-4adf-bec5-22b9f1fa1971	0db42258-ad0d-4141-9275-fd034517ec3c	e79979e1-326f-4b84-b613-ce32953d1f05	t
25a9109d-1876-4aff-9517-df603ca92221	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	e79979e1-326f-4b84-b613-ce32953d1f05	t
6d4586c9-e799-49c6-a522-8176c4968df4	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	e79979e1-326f-4b84-b613-ce32953d1f05	t
bfb5d93e-fb1f-40d0-b598-1c679ae20933	d6d99884-3731-41d8-b516-26b1dd281f41	e79979e1-326f-4b84-b613-ce32953d1f05	t
4c4838fd-cce3-4097-8215-3d667edbca6e	89eb4bea-11b5-423c-84ee-d938cc4c349d	e79979e1-326f-4b84-b613-ce32953d1f05	t
95f8138c-093f-4ce9-aec3-4860e4626d25	500f45ef-8fa4-48b4-99cf-99edb720aee9	e79979e1-326f-4b84-b613-ce32953d1f05	t
550d6f18-4c7a-4db9-b260-529887e69e74	a97cca97-0497-444b-8ab2-d5eb0170a835	e79979e1-326f-4b84-b613-ce32953d1f05	t
6537a8ac-092d-4e9d-b017-f2b25bfcc92f	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	e79979e1-326f-4b84-b613-ce32953d1f05	t
1f361264-e4b0-4d87-a980-fad16a15e528	5b3f094c-3897-4fa3-adad-8469c040f013	11c8fe77-61a2-4761-b804-46106525f467	t
84611e27-7ba9-4fe1-9265-9cc5275a00ac	1cf9bbfa-3ade-4997-b4de-7ec868abe610	11c8fe77-61a2-4761-b804-46106525f467	t
2ea1fa03-66ec-48a0-88b6-f25d58e6fad0	5ee6f424-dea8-4ee1-bcec-f89faecf9931	11c8fe77-61a2-4761-b804-46106525f467	t
40c5c738-c8e2-4669-8874-17b9e34239c1	e0a663ac-aaa5-47cc-9e22-a9cd71853246	11c8fe77-61a2-4761-b804-46106525f467	t
c26e9cd7-f7b2-4596-aac7-5cf385ffd68c	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	11c8fe77-61a2-4761-b804-46106525f467	t
9ef1d1e2-5ca1-4559-8f49-95ac8d1058d3	575a9512-8b91-4d99-a8be-f267fce026dd	11c8fe77-61a2-4761-b804-46106525f467	t
a73db51c-5234-44e1-a5ce-f3f47fb5731b	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	11c8fe77-61a2-4761-b804-46106525f467	t
b1ab2279-77e5-48c8-b415-c50d4ed61fda	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	11c8fe77-61a2-4761-b804-46106525f467	t
8d921542-3973-48df-bd49-63d68a9f8bfb	a8034fcf-21f4-49e8-a235-f33779c63ca8	11c8fe77-61a2-4761-b804-46106525f467	t
01614548-ce4d-40d4-bc2f-35db53c485a0	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	11c8fe77-61a2-4761-b804-46106525f467	t
8f5482f4-3e04-4037-926c-69188c0e970a	3ad98109-36cd-4560-a513-86387065f22a	11c8fe77-61a2-4761-b804-46106525f467	t
f7d58f86-82f0-4540-9978-506e93e25fb7	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	11c8fe77-61a2-4761-b804-46106525f467	t
5b1d169d-0d29-4795-98bf-502469fadb9a	0081c05f-e65c-46ec-8126-71e4ce15e2e4	11c8fe77-61a2-4761-b804-46106525f467	t
be710fb9-fae3-4197-bf85-ddb9a019d8dc	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	11c8fe77-61a2-4761-b804-46106525f467	t
503cb8b6-1074-4f6d-9eeb-ff021324045b	3a698be0-2982-4e83-b1f7-84ece51e725f	11c8fe77-61a2-4761-b804-46106525f467	t
d9984823-6443-4a84-9d6a-7e8614f02ea4	0db42258-ad0d-4141-9275-fd034517ec3c	11c8fe77-61a2-4761-b804-46106525f467	t
bbab5925-e2e8-42bf-b5ad-1ede16764cee	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	11c8fe77-61a2-4761-b804-46106525f467	t
d8053aa8-5875-4667-b86b-15404975900c	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	11c8fe77-61a2-4761-b804-46106525f467	t
ddf88a07-6817-4ebe-b23a-6be15072c729	d6d99884-3731-41d8-b516-26b1dd281f41	11c8fe77-61a2-4761-b804-46106525f467	t
3196f783-30dc-4339-a4d2-b1eb30add349	89eb4bea-11b5-423c-84ee-d938cc4c349d	11c8fe77-61a2-4761-b804-46106525f467	t
b488bdc5-83fc-40a6-bfef-e66e9c30ebaf	500f45ef-8fa4-48b4-99cf-99edb720aee9	11c8fe77-61a2-4761-b804-46106525f467	t
30285319-5b6d-44fc-b24b-8bf38333d598	a97cca97-0497-444b-8ab2-d5eb0170a835	11c8fe77-61a2-4761-b804-46106525f467	f
7f737c80-eaa5-490a-a7ff-5b8a9134c315	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	11c8fe77-61a2-4761-b804-46106525f467	t
aa2222ad-979c-4f9c-a9af-ab5b7337e04e	5b3f094c-3897-4fa3-adad-8469c040f013	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
522896e8-e2f7-4bfd-ac5b-fbdb6f146d91	1cf9bbfa-3ade-4997-b4de-7ec868abe610	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
4f252af4-6d61-4626-9fae-e0b2dab3ff19	5ee6f424-dea8-4ee1-bcec-f89faecf9931	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
0fc03ddc-cd34-4703-9ecf-78c8613605e1	e0a663ac-aaa5-47cc-9e22-a9cd71853246	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
ba5b9db1-1cc7-4815-ae57-5efcd53c5981	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
95d7fe53-fcfa-4c82-9168-4a2d540cca06	575a9512-8b91-4d99-a8be-f267fce026dd	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
7f7a7154-e5e2-4428-b137-8fb5e24d312f	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
f104f95b-df55-43aa-8a80-5f687755a663	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
55889f2f-3970-45f0-a05c-e26a20df12cf	a8034fcf-21f4-49e8-a235-f33779c63ca8	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
b3271dbd-37b1-4eea-b8c5-110e5b04300f	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
a32d27d0-ed19-4d6b-ac37-7de8b0333227	3ad98109-36cd-4560-a513-86387065f22a	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
8649d362-f928-4fab-a61a-8524b9230979	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
41745d14-e931-4068-a3ad-c4fb9b8c1828	0081c05f-e65c-46ec-8126-71e4ce15e2e4	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
5f55d7d6-b2fa-4802-b4eb-d2c12c0c2840	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
d9088f75-568f-4d03-86ac-f93094fe65a9	3a698be0-2982-4e83-b1f7-84ece51e725f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
7c7b6007-0d57-46a0-8c9e-4879b929bfe4	0db42258-ad0d-4141-9275-fd034517ec3c	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
4b05120d-78f7-4083-80aa-203f839d3874	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
c809fdb6-1b54-4abb-b447-5f87f7cd2a8f	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
8b843d8a-4dd6-4dd6-9bca-4b17570a21a0	d6d99884-3731-41d8-b516-26b1dd281f41	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
0e8b989b-e1ea-4394-b3e3-b7ae4f2e2b6e	89eb4bea-11b5-423c-84ee-d938cc4c349d	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
090d6670-1278-44a2-9aec-e810986421c5	500f45ef-8fa4-48b4-99cf-99edb720aee9	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
f85124f5-1bcb-4e3b-a082-df0618e84786	a97cca97-0497-444b-8ab2-d5eb0170a835	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
2e07bd3d-e317-427f-a622-a0fc62eac025	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	t
0d3054c9-8605-40a3-b4d1-80225ad548db	5b3f094c-3897-4fa3-adad-8469c040f013	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
ba2dc7ca-5659-47f2-8302-432a12e9d5d2	1cf9bbfa-3ade-4997-b4de-7ec868abe610	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
d2db1b9f-07be-4de4-95b6-4cba2cea9bbb	5ee6f424-dea8-4ee1-bcec-f89faecf9931	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
f520e60e-b256-489e-be77-dbf1591b9baf	e0a663ac-aaa5-47cc-9e22-a9cd71853246	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
73392b04-189e-4d4e-b159-43510daa4436	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
f9a75674-f778-4b3c-b326-bdbc27b4a216	575a9512-8b91-4d99-a8be-f267fce026dd	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
669de87b-730d-4766-9bc8-c4d28edd6d2a	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
57775781-fa23-4e00-ac3d-beda7a5f6f40	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
f217aeae-96a7-49f3-b0ec-883bb133d892	a8034fcf-21f4-49e8-a235-f33779c63ca8	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
4bbc6b35-2f0c-44b3-a7ed-e00b75b3f421	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
2b354f5a-9c1a-4c41-8b15-438bace84a52	3ad98109-36cd-4560-a513-86387065f22a	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
7496ff07-f039-4cf7-a533-f2233ad4437b	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
ed43f486-5584-4e4a-bfc7-b331412bd5ec	0081c05f-e65c-46ec-8126-71e4ce15e2e4	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
6219e91e-607c-4f8c-97b0-44d7071c8615	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
015440bf-0746-4ed2-a2ce-bf912cac6f8b	3a698be0-2982-4e83-b1f7-84ece51e725f	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
3f06f890-3ff6-449b-9c96-fa2ef29d26dd	0db42258-ad0d-4141-9275-fd034517ec3c	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
c7bcf01b-506b-4ff2-9031-e7039b148db8	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
f9a0aba9-a85b-4dbc-b789-111e7efa26ee	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
b08a3386-2fcf-4aeb-9720-4475b075dc49	d6d99884-3731-41d8-b516-26b1dd281f41	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
e283890f-0aaa-447e-bc79-5af09c551202	89eb4bea-11b5-423c-84ee-d938cc4c349d	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
1785793d-df51-413c-a062-15c87f11072e	500f45ef-8fa4-48b4-99cf-99edb720aee9	504a4c9a-95b7-4872-9db9-78483e3e1e60	t
943598fc-b7eb-44dd-96f7-46e5ad708309	a97cca97-0497-444b-8ab2-d5eb0170a835	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
24775717-c5a5-4ed5-9214-12c1dbe1e00e	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	504a4c9a-95b7-4872-9db9-78483e3e1e60	f
387d8f31-2149-479f-9de0-512ea23794d8	5b3f094c-3897-4fa3-adad-8469c040f013	c827a01f-387c-4c59-bfcd-829297a30a74	t
f3d94dde-50cc-4ac2-a943-f9432d9cd82a	1cf9bbfa-3ade-4997-b4de-7ec868abe610	c827a01f-387c-4c59-bfcd-829297a30a74	f
fccd9776-1ea8-4038-98b0-3b26ae27cc78	5ee6f424-dea8-4ee1-bcec-f89faecf9931	c827a01f-387c-4c59-bfcd-829297a30a74	f
921d8846-8862-4dde-9928-1f8273d943ed	e0a663ac-aaa5-47cc-9e22-a9cd71853246	c827a01f-387c-4c59-bfcd-829297a30a74	f
c4fbfd21-4ef0-419b-ac33-3e4cf247a2d3	a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	c827a01f-387c-4c59-bfcd-829297a30a74	f
4049b869-fd4c-4a80-9cf3-69034eb682ef	575a9512-8b91-4d99-a8be-f267fce026dd	c827a01f-387c-4c59-bfcd-829297a30a74	f
f64bb004-cdc6-4f48-9830-9669ff38ea6c	8d0750e2-4bec-46e5-bd49-1cf8af9367a9	c827a01f-387c-4c59-bfcd-829297a30a74	f
9ab929a8-1aa2-4303-af63-a6488ecf00c3	9b0f7d4f-0238-4175-bbf0-a5911e19bb80	c827a01f-387c-4c59-bfcd-829297a30a74	f
eebcf395-e68a-48fc-a87b-d554762584d3	a8034fcf-21f4-49e8-a235-f33779c63ca8	c827a01f-387c-4c59-bfcd-829297a30a74	t
36c811c8-364e-47af-9d4f-42e233e478cf	9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	c827a01f-387c-4c59-bfcd-829297a30a74	t
fc83bee1-adea-4ba8-855d-dced365489b0	3ad98109-36cd-4560-a513-86387065f22a	c827a01f-387c-4c59-bfcd-829297a30a74	t
5adb7561-3b12-4ec2-a188-5c5a6abe6fe4	e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	c827a01f-387c-4c59-bfcd-829297a30a74	t
f237982e-c78f-490c-9e48-cbb57fc99168	0081c05f-e65c-46ec-8126-71e4ce15e2e4	c827a01f-387c-4c59-bfcd-829297a30a74	t
39e5133a-fc66-481b-9682-bbea23242d2e	811dbf9b-283c-4daa-9e0a-fabee7e6fb63	c827a01f-387c-4c59-bfcd-829297a30a74	t
f7239a41-cd24-4930-9436-a8d9c732d645	3a698be0-2982-4e83-b1f7-84ece51e725f	c827a01f-387c-4c59-bfcd-829297a30a74	t
8b002b26-85cb-4ebf-bb01-a3315665c759	0db42258-ad0d-4141-9275-fd034517ec3c	c827a01f-387c-4c59-bfcd-829297a30a74	t
a742c714-b2ab-4bdc-920c-edc9ca4a9b3b	2ea6b3a7-35ec-47e3-b8a3-679da2da7976	c827a01f-387c-4c59-bfcd-829297a30a74	t
68bce323-c6f8-4eb2-8a33-bbc10b9947d4	f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	c827a01f-387c-4c59-bfcd-829297a30a74	t
1d4dc875-f3a9-4f23-b0ff-ee5da3642111	d6d99884-3731-41d8-b516-26b1dd281f41	c827a01f-387c-4c59-bfcd-829297a30a74	t
af254694-36bd-478c-955c-d3cf000c8966	89eb4bea-11b5-423c-84ee-d938cc4c349d	c827a01f-387c-4c59-bfcd-829297a30a74	t
1d9c85e0-691c-48e5-a9c8-9e60ab2744af	500f45ef-8fa4-48b4-99cf-99edb720aee9	c827a01f-387c-4c59-bfcd-829297a30a74	t
5b1318c8-9677-42e2-ad2e-1896b3db64a6	a97cca97-0497-444b-8ab2-d5eb0170a835	c827a01f-387c-4c59-bfcd-829297a30a74	t
f394be79-7ece-495f-b79c-7737de59ca8b	a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	c827a01f-387c-4c59-bfcd-829297a30a74	t
\.


--
-- Data for Name: AttendanceRisk; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AttendanceRisk" (id, "studentId", "riskLevel", "riskProbability", attendance, "notifiedAt", "updatedAt") FROM stdin;
c6899315-bb9a-4e4d-b118-d928773f7070	d3110109-1689-4d8a-a4f2-ec0853255af3	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.484
4f4efa58-2100-481e-8479-360af876a4b4	2af14b44-78e1-4ec2-960a-e11029660d65	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.486
0ad0a0c1-4d38-4009-9737-6afd05e06a06	c5f4e3da-1dfc-4c5e-9987-ca0264885397	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.486
d9516248-26e9-4937-bf88-084b1b39dcb2	7d845671-0935-4065-8572-a8b91f5f95f6	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.484
5761fb0c-af9e-4125-a341-8a5002071f0d	dde09176-04cb-4454-a259-38452376cc5a	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
391f77bc-740f-4e1c-9803-0162ff153231	886dbe27-1de9-49d3-9107-cf9d7fbb0673	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
272b417b-865c-4084-8af7-4bbbf34aec7f	88fe0ea0-df61-4517-8294-3d4a999d12a5	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
77f43795-49bd-434b-bce4-fe4865fe4456	c2bce4db-8126-4b66-9530-8e3988343bce	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
2e88d018-37b0-4387-b63d-0ce1b80f171a	21ebdada-3ed0-47d9-a6a4-7f060c20fa0f	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
e9e346d0-6ed0-4b6a-8861-8f7b8d6db80e	b722a40c-844f-482a-a84c-2d07a90a8ecb	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.485
d9226ad6-50b9-4e05-a569-a37de059a549	18a5c0b8-37b2-4350-adb3-54214a85e630	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
7815166f-14cb-4a53-93cb-a3c55213b01a	1c95452e-7094-4393-a18b-fbe1a743d9bb	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
71832a1c-56bf-47ad-8002-069a6b819eda	ffa605bf-83f6-4cf1-8e53-e552b0926053	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
4c3fdb8e-b1bf-4e3c-9142-b5b50e0b9d9e	529b4378-fa58-4d3c-bffb-84a325f042b6	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.486
e1dbf09f-a7f9-4827-8cec-7e590cb1f749	1c9dce7e-ab84-402e-b13b-15f32554b527	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
35825202-2463-44c2-8c72-b022a2ebb382	8e59ff7f-b31c-482b-836c-720caf5e727e	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
aaeb0c0a-71c9-4f5e-ac1d-1160175ad59f	de234f31-cfde-44ab-99ef-c2a288e4ffe5	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.492
af0e19fb-4a50-40dd-97bb-445a8fe08e7c	600cdbf2-5a7d-423b-9e05-a8cecf25b338	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
ff215a21-f2c8-418b-9d54-92c7513f7d5c	35c3a49b-bff4-4246-b70a-55eb55b423f0	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.492
3be2b6f1-0ffd-4e10-8ebf-71d344cc9d46	49759c5f-2b3e-4c6e-82f1-2586918a80b9	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.492
9907ebc2-a058-48c2-ade8-d246654ec9e2	29263da1-2775-4557-8fcc-d2a5164f8987	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.484
4eec59d0-a6ad-431a-bcab-720114f23e65	e3cdcecb-1aab-4642-977c-9ddaf8386911	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.485
e6b99833-5f38-4237-9cfe-cb67be954f72	5a93e483-f914-49b8-9e36-f68545ee5a6a	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.485
fb8ecc47-0c06-40c3-a443-bac53dd26655	42747a4d-181c-4e7e-a215-3d228685873c	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.556
46602a92-9b3d-4c27-8b64-262fe5334e9c	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	WARNING	0.75	68.5	\N	2026-03-10 16:39:43.561
ab19bcbd-73dd-49dc-9fc8-4b27aceaab4f	11c8fe77-61a2-4761-b804-46106525f467	SAFE	0.9	95	\N	2026-03-10 16:39:43.56
557e3f90-a61b-4561-a162-bc79eedabbff	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	WARNING	0.75	66.5	\N	2026-03-10 16:39:43.559
5a67f523-3f63-418a-a9ed-b44973d261d5	8eb4c043-6391-4c13-adbb-d77ca1c9dc8e	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.555
07e11319-042f-48d7-b3c5-f6931d63050c	ae753320-c362-4d8b-8294-53533a1a5798	WARNING	0.75	70.75	\N	2026-03-10 16:39:43.558
1a76e443-a8d1-4dc0-bf18-b523f42e38ce	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	SAFE	0.9	99	\N	2026-03-10 16:39:43.56
73c3573b-b80b-42b0-8e58-972916a1d88e	ddc2de80-076e-4d20-ad92-7b0ecc067deb	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.555
f4783354-a92b-4b9c-b755-1467270173ea	f1719575-4aea-4b3e-a61c-b8307ccf9516	HIGH_RISK	0.85	62	\N	2026-03-10 16:39:43.558
04b25a41-0dd1-4fde-bb8b-090b514505f4	a6a8d329-a29d-41b9-8206-4899ea5c5430	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.557
47dec8e7-29c4-4721-bb40-5fd8190036f9	65ef7119-ea28-4a7a-9329-fcef962e4343	WARNING	0.75	65.5	\N	2026-03-10 16:39:43.558
3b36e5ba-42a8-431a-86e0-50a42e9dda62	b28a336c-146e-43d4-af87-dad6f4f98f09	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.557
6d996b2d-0ae0-498d-bcc8-246e0cb0cd8d	f3575bed-7b01-4358-bdf2-3d1f81cc2515	WARNING	0.75	66.5	\N	2026-03-10 16:39:43.559
252d1343-2813-4611-b2fd-61bf360f066f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	SAFE	0.9	94	\N	2026-03-10 16:39:43.56
5cc44fd3-3bc8-4760-a75c-881e118d8d39	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	HIGH_RISK	0.85	64.75	\N	2026-03-10 16:39:43.559
1499b0af-70af-4404-8a6b-4021f276fe1d	95465124-34e6-4104-95f7-2f6289016331	SAFE	0.9	79.25	\N	2026-03-10 16:39:43.559
62eba43a-59a9-496b-af1b-5814b1878f26	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	WARNING	0.75	74.5	\N	2026-03-10 16:39:43.559
92cd3e9e-9209-40c3-8c35-51cd6e05e3aa	c827a01f-387c-4c59-bfcd-829297a30a74	SAFE	0.9	77.5	\N	2026-03-10 16:39:43.561
f34e92a3-c2f4-4ffc-826e-508506c7acbe	c1c97976-38c1-4174-b028-57b0273c7fac	HIGH_RISK	0.85	61	\N	2026-03-10 16:39:43.559
49dae3b8-1b60-49b1-8ac8-be3b46f01c60	b4c659f3-cb6d-4f5f-90ca-e195cde8de00	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.555
dc931186-68ab-4450-8399-ed810e58323b	47d8c413-5440-4d05-90cb-0757217fdfaf	WARNING	0.75	73.25	\N	2026-03-10 16:39:43.56
6bd2224a-3414-4046-be45-51a69c07e937	a78272dc-151f-400f-a0b4-1eeec317739c	SAFE	0.9	77.5	\N	2026-03-10 16:39:43.559
c69d6998-0261-4f78-9e0e-d72ac4f9d431	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	WARNING	0.75	71.75	\N	2026-03-10 16:39:43.56
783de8a2-8315-492e-8add-4ea41b3260c7	fe695664-7f7d-4902-ac11-4abb6e7fd547	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.556
2aad2c9c-83dc-418c-9f4f-5347d7c5e5ea	a9b2336c-9cbe-49d1-abd1-fe75a04c87c6	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.557
32a231cc-6ef3-42a9-96ca-d0cbf3d3dd39	50cc254e-e0c8-4a9d-a59e-1faeabc25f44	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.485
e16db700-59a9-405e-b0f5-8cea2608ef86	f1c534f1-11f4-468b-be3a-25823c9a0ec4	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.486
df926734-2984-4bab-8707-9a99d09e8cc4	63dbb247-8757-4354-9421-d9f4c9cda5af	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.484
2cfcce6f-665c-4e00-91b8-a0ff0916c771	0c214219-2412-408e-9a11-5e087f5361ba	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
36e0a966-9579-43c5-84e0-c21d05b82934	4538cab4-dc5b-495a-97d3-db4101377fe6	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
f5e7703e-8e24-458d-bd0e-58873d1fd01c	8f2721bc-0e3f-4900-a2a3-98e8e899d795	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
20fa0644-3426-43e2-a364-de98afa8790a	da5eeda2-d919-407b-8f55-0865b57e8c94	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
c60f2522-eb09-46b4-9de8-283dba2646fe	f240b7b2-476f-4299-8b7d-254a2092e8f5	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.492
5aa6e2c9-9395-45b5-bc23-255ad4c637a7	40319cfd-3b35-4384-98ac-7d50eb29dcc7	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.486
c50283ed-0400-4399-bc76-e63cc47b850a	5d77cb41-e929-43b1-85c5-bbc75496c95b	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.486
cbc659e9-747b-40d5-a6ab-6bfd2f779d9c	2e64f093-a856-464f-b34d-52d4f8eb3c78	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.486
5dbf07a4-2d01-47ee-a5bd-3254cb9a5620	768666a7-46ff-449f-912c-025c29d7e9bb	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
e17e7779-8a4d-4b92-a9e7-994ec8a4e58d	ec973db4-b310-46ec-893b-2afbea2a126b	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
a81c105b-dc09-47ff-92a9-301a4b9c6b6c	c19dc115-56db-4d12-830d-5ee66029de79	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
be372cc6-bdbb-4cea-b567-d837b73cd44f	d1fa3414-314d-4687-9f41-b6851bd0e903	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
9a857f33-472b-4f33-941c-2c0e14b40ff4	860139be-85f8-4cab-b576-1cf41eeadc4b	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
fab32db8-ee37-435f-af91-56ac9e1b3171	a78eb282-ff96-4abe-b0af-0382ba562c7d	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
7c87ff33-46e1-425a-92a5-32d73ba546bf	33a1b435-e6c5-44af-a070-844185ae8aa2	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.484
07167daa-5845-41a8-9364-8efa1ea91ca0	0ebea013-f16f-440f-ac52-4d77325c694f	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.485
b6901bbe-87a3-45b7-911f-77f60c15be7f	c5fc71a3-071d-44b3-9e9c-bffb16126064	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.485
1bfc18d5-ccf5-44fb-b492-15efd8c6c2af	6948728b-506e-4371-9f78-d9eea4c88432	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.484
0f0e003d-9b75-4a5a-be04-5d0b014c7b4f	535f45e3-25a6-4f75-8746-b92a3bed87ea	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.487
dab8ff16-d62e-4c85-8a28-2bae4eed5c40	dc039b49-e449-4487-bf50-b6cba344de03	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
96aeda49-54f5-4be0-9c5d-f0bfab7d67f7	600aa6e2-68f5-4576-86eb-6f6331edb45a	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.489
5b60a5a5-4864-4291-ba11-9220008473f7	2a68a130-870d-4f63-b578-3e3cdb3ddfab	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.492
5f5cdeae-aec2-4a35-b144-a5753137edbc	e253f0b1-0cd3-43f7-b8ce-8be1f46b571f	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.491
b90b12bb-1cf2-42e3-85f3-4d4fba2ee232	5e5b352c-d716-4f9d-b9d7-c2d9842f9723	HIGH_RISK	0.85	0	\N	2026-03-10 13:13:06.49
d8aebb95-a2eb-4cf9-aabf-f0592218eb05	e79979e1-326f-4b84-b613-ce32953d1f05	SAFE	0.9	98	\N	2026-03-10 16:39:43.561
d572f16f-2a3b-4f15-9fe8-a4a93caa70da	fa969a8c-dea9-452d-9fe0-e03590643fd0	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.555
bd4526cf-acd6-42fa-80f8-e22a4afedb39	8dd0359b-1da1-41aa-ada0-3342c623c5b4	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.557
4998f42e-493a-4e82-8f89-17a83154f364	31743efc-7a80-4efc-957d-dd325851ad8f	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.554
4b85c97e-3c12-4887-880b-b3fc5ee439e5	933c1dd7-ba87-4e5c-a905-a4f0454ec677	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.556
a59b4d10-831a-49bc-a43c-4c72c703efd4	ab8d6a3a-8889-442c-996e-15825a25e37f	WARNING	0.75	70.75	\N	2026-03-10 16:39:43.558
ad9b208e-a57c-44ed-b747-ee961f249aa1	128691dd-ff65-43d8-8bf4-bb59e2e58617	HIGH_RISK	0.85	53	\N	2026-03-10 16:39:43.558
01bf0570-c73c-432d-a454-af4381f497a4	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	WARNING	0.75	73.25	\N	2026-03-10 16:39:43.558
cd89c348-a8c4-4731-8863-96ab1ea94849	7b87886d-bc7a-4bee-9368-b52ff2101ab1	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.555
d067e5e4-7027-4162-8858-f88c6b040297	270c7b2d-c393-485a-9667-02dee4d0403f	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.554
a5e4d8d7-e2d6-4a67-8943-60962606ee38	fd519d52-433b-4bf7-8e7d-e18caeccf843	HIGH_RISK	0.85	51.25	\N	2026-03-10 16:39:43.559
ae0bca73-437c-4e1b-9f85-173fb1addf8a	a448971c-bfff-49f6-a5d1-99dba7ca6172	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.557
4ff1c2b7-c4ac-4551-ac96-74b5050cd002	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	SAFE	0.9	95	\N	2026-03-10 16:39:43.56
ceedccca-c610-4d2f-9e3a-230d18da46e1	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	SAFE	0.9	97	\N	2026-03-10 16:39:43.56
5fc7961b-169e-4165-b8fd-91619d09c76c	18f60faa-953f-4d47-b858-8c5d78a9b1ba	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.556
f5b99aa9-d475-49e1-a2eb-6f4494743a43	39cdd710-8e5b-4a50-9966-f261472dc3c6	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.554
9ec2b902-9773-49af-a43a-20621e5cc81a	504a4c9a-95b7-4872-9db9-78483e3e1e60	SAFE	0.9	87	\N	2026-03-10 16:39:43.561
4a0509a0-0d59-4ed0-b72e-b5d01b40e045	dc581723-4dbb-48ac-909a-b6854f1d7219	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.557
e5596801-5f1c-4915-b0c0-d69b38485ef5	5d8be432-3c03-424a-906b-34abbd8f08f0	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.554
805cfc6d-df31-4e9a-98a3-52c358e1e537	58c006d6-3e2c-4baf-a1fa-24bab631786a	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.555
454c224c-2ad2-4e9d-8c58-f60e752f7a3a	7dca393c-e374-4fd4-be89-9a7a9c3f4a00	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.557
071cf7a5-74e6-470c-b3ec-069b268d218d	36ceeb1e-a893-431c-9d7a-0b30ae5c9646	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.556
d5c02229-70a3-4348-9877-d9ec11ca3687	0e9a2426-af70-4908-947f-c819a14ad377	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.556
fe5bd93b-f5dd-40d1-88cd-c46263187ada	2925a97c-5364-4fb0-bace-550fdb30f785	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.558
d5bce54d-3581-4515-82de-2e1d0c740095	130e9031-4b46-4ce9-b1fd-6e49462d0cfd	HIGH_RISK	0.85	0	\N	2026-03-10 16:39:43.556
\.


--
-- Data for Name: AttendanceSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AttendanceSession" (id, "subjectOfferingId", date) FROM stdin;
f54f10cb-97ad-4234-a75f-c302f04f47c9	7e589f4c-041c-4721-8823-937f9a38f058	2026-06-30 18:30:00
9f3fe0dd-ca5e-441e-9c88-046840e98fe6	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-01 18:30:00
e00dec9b-4ee9-4f25-a125-03c806f3556c	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-02 18:30:00
eacbc2ec-1d49-4099-985d-b0879662b6e4	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-03 18:30:00
a549e323-bd8e-4df3-9767-83b948c3fea0	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-04 18:30:00
0007ed4f-52d4-48d6-8987-fd7da37cc8ea	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-05 18:30:00
df736872-f0e0-4fab-bd9b-bf6ec37c6738	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-06 18:30:00
f42b377d-c608-4523-b690-7f890c9918e0	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-07 18:30:00
d38185b6-6436-4e71-98bf-e46862dd84db	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-08 18:30:00
84948d42-653c-4704-9685-83ceb9ef0292	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-09 18:30:00
d38f1cff-de34-48e0-9d7c-2d8687d6d335	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-10 18:30:00
d796a01a-9e5a-4184-a99f-791487ecc13f	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-11 18:30:00
ca79c2ba-be60-4521-8ae0-a79ad5b76a7f	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-12 18:30:00
867977d1-ed38-4338-8e00-d51db1efa8d0	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-13 18:30:00
624904ad-8ae9-4b39-b920-cf3ec7f5b1bf	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-14 18:30:00
746bc4b3-6f2d-4cfc-aaa6-0b30b6c828b1	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-15 18:30:00
a4df1bb6-2eb2-400f-8cc2-739f6833f98d	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-16 18:30:00
6fba7b48-d4e6-4870-bebc-f2cf758809b2	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-17 18:30:00
53977b1c-d564-4166-b113-338d5332fc48	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-18 18:30:00
5b5bfafc-1139-4003-9526-3c5ba6a791b0	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-19 18:30:00
77c6bc33-5da3-40de-9ed2-cc36ab4e4fa7	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-20 18:30:00
f553dbaa-1ad2-4ae0-809e-5ce7c5c7a1a5	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-21 18:30:00
45327728-ad89-43be-8445-87c2f73c84b8	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-22 18:30:00
2896a379-554f-49a0-9969-a0c755ce4991	7e589f4c-041c-4721-8823-937f9a38f058	2026-07-31 18:30:00
9c3112e3-de6e-4323-93ef-c61d1c4e6c10	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-01 18:30:00
13846310-0456-481d-8791-66eac9f53c8f	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-02 18:30:00
aed3be59-7096-4d93-ba73-375f068ac05a	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-03 18:30:00
fce4b9ae-c28f-43bb-ba90-abf2010a693b	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-04 18:30:00
e08a71c1-1534-4d03-bdf2-8c3a6bcca4c9	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-05 18:30:00
4db35518-a75a-427b-9f28-ada15be0f391	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-06 18:30:00
13c6c895-d834-42eb-8865-decc01d94e42	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-07 18:30:00
0af7012d-d1e2-447e-8903-19e4becd0d63	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-08 18:30:00
922f4bf3-4a24-49c1-ad57-b74a05a253ab	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-09 18:30:00
6ac214f6-41cb-4be6-9765-df33bad3b63f	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-10 18:30:00
bc914e7f-4401-4448-aca9-9c058ae999b3	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-11 18:30:00
4cfb8cf3-47e0-4a4b-906a-360e31250dcd	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-12 18:30:00
6999d1c6-2ac2-4bf7-bafd-92b73b0cbf77	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-13 18:30:00
c0fbd9f3-9271-433c-9075-d96b25eba0e9	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-14 18:30:00
ea9057ff-1aa1-4565-b084-f743a4a3d975	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-15 18:30:00
d0fef3a7-0459-4c5a-a6a8-f953cf8448a5	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-16 18:30:00
68c06cf9-d8e9-463d-93f7-360c8daa7683	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-17 18:30:00
9343db3a-1078-4fb4-a1be-4e212a7fb1ff	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-18 18:30:00
8d2a1019-c4ca-4f08-a33d-a32db4bc33f2	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-19 18:30:00
ffe05eb5-ab28-467b-9e6a-e2a88887876b	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-20 18:30:00
cc6392ae-9095-409a-a453-b95fcfcc16f1	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-21 18:30:00
999a870f-4b2a-4161-82d9-ba58c7a77fd2	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-22 18:30:00
6d204d7f-e985-4328-90ea-cebf86b9271b	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-23 18:30:00
cefec3aa-fd5a-4814-80b9-cc15dd5cde8e	7e589f4c-041c-4721-8823-937f9a38f058	2026-08-31 18:30:00
25939211-bf7f-4658-95d5-40a0e6b562c1	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-01 18:30:00
d9a6e114-6ac7-41c4-ae95-0c20e284c1b1	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-02 18:30:00
358ba0ad-51de-499d-9f0b-afebc303265f	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-03 18:30:00
94f6af3e-6ec8-4020-b5b3-33d9cf3f6623	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-04 18:30:00
6590496d-f51e-4a1b-b8f3-2c4c51b3d81b	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-05 18:30:00
316f17a8-6650-4a15-ac63-584b710e85d3	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-06 18:30:00
452d708f-19a9-4295-ad7a-42826a21212f	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-07 18:30:00
7e454624-36e5-4a0c-aeba-ecd50b76734f	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-08 18:30:00
a21c633e-8260-4e3a-9ac7-46a34da28827	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-09 18:30:00
a1195634-f79d-41db-9193-10c2e68dfece	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-10 18:30:00
ab9a418e-1e79-4fc4-877d-9c52baa03768	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-11 18:30:00
55e896ce-f843-4eed-aa1e-e937a7a5a84b	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-12 18:30:00
e6647eb9-e85a-42d3-be5c-ff0536c215b8	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-13 18:30:00
238a8ed1-5657-4fea-8221-85d2489b1d52	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-14 18:30:00
a02d62b1-d14e-4f30-85a4-25ee0ce66be2	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-15 18:30:00
7b74136f-d26a-48a3-9896-4369f6040d65	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-16 18:30:00
42a1438a-1f58-4fb7-8085-46833848c9c3	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-17 18:30:00
f96ed8ef-6b4b-451e-9af6-ed8592fc9678	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-18 18:30:00
598b3c2a-c143-44ea-9f3f-f1a180dd268b	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-19 18:30:00
478dcb48-fda6-4d62-aafe-9e7c16013f65	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-20 18:30:00
1a584474-6eb4-47e7-964f-ec7ef9340795	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-21 18:30:00
d9048a89-cc5d-484c-b402-c9a4f63d829a	7e589f4c-041c-4721-8823-937f9a38f058	2026-09-22 18:30:00
5b3f094c-3897-4fa3-adad-8469c040f013	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-06-30 18:30:00
1cf9bbfa-3ade-4997-b4de-7ec868abe610	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-01 18:30:00
5ee6f424-dea8-4ee1-bcec-f89faecf9931	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-02 18:30:00
e0a663ac-aaa5-47cc-9e22-a9cd71853246	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-03 18:30:00
a4e527f8-6279-4ea2-9f53-3eb5df4c3e1c	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-04 18:30:00
575a9512-8b91-4d99-a8be-f267fce026dd	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-05 18:30:00
8d0750e2-4bec-46e5-bd49-1cf8af9367a9	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-06 18:30:00
9b0f7d4f-0238-4175-bbf0-a5911e19bb80	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-07 18:30:00
a8034fcf-21f4-49e8-a235-f33779c63ca8	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-08 18:30:00
9d6d62a9-ff58-45c3-aaa9-9f87f02738d7	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-09 18:30:00
3ad98109-36cd-4560-a513-86387065f22a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-10 18:30:00
e786c1f8-dc3e-48b2-a8bd-7ad81b34bb48	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-11 18:30:00
0081c05f-e65c-46ec-8126-71e4ce15e2e4	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-12 18:30:00
811dbf9b-283c-4daa-9e0a-fabee7e6fb63	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-13 18:30:00
3a698be0-2982-4e83-b1f7-84ece51e725f	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-14 18:30:00
0db42258-ad0d-4141-9275-fd034517ec3c	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-15 18:30:00
2ea6b3a7-35ec-47e3-b8a3-679da2da7976	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-16 18:30:00
f6ef9cde-0bfe-4d4e-9ac5-2f6926f24db6	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-17 18:30:00
d6d99884-3731-41d8-b516-26b1dd281f41	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-18 18:30:00
89eb4bea-11b5-423c-84ee-d938cc4c349d	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-19 18:30:00
500f45ef-8fa4-48b4-99cf-99edb720aee9	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-20 18:30:00
a97cca97-0497-444b-8ab2-d5eb0170a835	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-21 18:30:00
a7a43ae4-061b-47ad-b019-2d53fd8d4f6f	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	2026-07-22 18:30:00
\.


--
-- Data for Name: ClassTeacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ClassTeacher" (id, "teacherId", "departmentId", "academicYear", year, semester, section) FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Department" (id, name, "hodId", "shortId") FROM stdin;
dc726e53-c910-4fdd-9f1d-92e401e45844	Computer Science And Engineering	\N	CSE
74dbf940-4f60-43de-a65d-d84f0ae07bc2	Electronics And Telecommunications 	\N	ENTC
8af6fd14-ffce-4c1d-adf2-d6f4d63bef96	Artificial Intelligence And Data Science	\N	AIDS
91025200-7ea1-40f3-8d2b-60be0a2939b4	Civil Engineering	\N	CIVIL
7402bcd5-5693-4857-b770-b95457743822	Mechanical Engineering	\N	MECH
1d2eac93-85a5-40ff-9d41-b8055456a393	Master Of Business Administration	\N	MBA
f64e716c-0a08-453f-9703-31f51cb8d7da	Information Technology	ce7474b5-e7d1-416a-afc2-38ddd95a09f5	IT
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Document" (id, "userId", name, url, "createdAt", "subjectOfferingId", "subjectId", "fileType", size, category) FROM stdin;
7657b681-8212-44c1-82e4-e6f49da6e8b4	d52301d5-d9a4-4d66-ba12-dead4e77134c	report_STU124_slate (1).pdf	/uploads/course-docs/1772973961960-report_STU124_slate (1).pdf	2026-03-08 12:46:01.965	\N	\N	\N	\N	personal
014b83c5-cb4d-490a-9c6b-a4f8ff5a178e	d52301d5-d9a4-4d66-ba12-dead4e77134c	report_STU124_slate (1).pdf	/uploads/course-docs/1772974474363-report_STU124_slate (1).pdf	2026-03-08 12:54:34.368	\N	\N	\N	\N	personal
41820019-586f-4aff-b095-101709bde308	d52301d5-d9a4-4d66-ba12-dead4e77134c	report_STU124_slate (1) (1).pdf	/uploads/course-docs/1773093352900-report_STU124_slate (1) (1).pdf	2026-03-09 21:55:52.906	7e589f4c-041c-4721-8823-937f9a38f058	\N	\N	\N	personal
\.


--
-- Data for Name: Enrollment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Enrollment" (id, "studentId", year, semester, "academicYear", section) FROM stdin;
94cb667b-7b19-4286-9c00-1534ec608a36	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	2	3	2026-2027	A
de7544ab-92f9-4526-8e6b-616a74001e37	ab8d6a3a-8889-442c-996e-15825a25e37f	2	3	2026-2027	A
10895e85-d204-4484-a278-1b0b34bde155	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	2	3	2026-2027	A
4eff6ddc-363f-45e9-98a0-35407217a7f3	ae753320-c362-4d8b-8294-53533a1a5798	2	3	2026-2027	A
c8840a98-617f-4f88-baf7-ef7e6a394ab2	f1719575-4aea-4b3e-a61c-b8307ccf9516	2	3	2026-2027	A
fb4fa826-2f49-429e-810b-561cf8539cd6	128691dd-ff65-43d8-8bf4-bb59e2e58617	2	3	2026-2027	A
e1b1aa92-c9fa-47cc-b564-f7f260ef0199	65ef7119-ea28-4a7a-9329-fcef962e4343	2	3	2026-2027	A
98627b9e-2959-44f4-ad9d-b6983b3e34c0	c1c97976-38c1-4174-b028-57b0273c7fac	2	3	2026-2027	A
bee7da8b-1b33-4108-8b13-90856d2699d3	fd519d52-433b-4bf7-8e7d-e18caeccf843	2	3	2026-2027	A
2d15719d-c576-416c-b5f6-bf051a63a7c3	f3575bed-7b01-4358-bdf2-3d1f81cc2515	2	3	2026-2027	A
18fb1a95-3e27-4930-879c-471f021f37ed	95465124-34e6-4104-95f7-2f6289016331	2	3	2026-2027	A
8eb2b372-79c5-41b7-ba01-ff1221030672	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	2	3	2026-2027	A
71f458b8-5be1-4369-902e-05e91f8dd5f4	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	2	3	2026-2027	A
dd83a87c-0204-4517-8a05-f52a94225b62	a78272dc-151f-400f-a0b4-1eeec317739c	2	3	2026-2027	A
6849c8c0-5df0-4f60-a89f-5e7f3e446410	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	2	3	2026-2027	A
c45cf174-b214-41a2-9561-a104f4b7b98a	47d8c413-5440-4d05-90cb-0757217fdfaf	2	3	2026-2027	A
3b9b682d-27bd-4a01-904d-d2d0e5b13eb0	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	2	3	2026-2027	A
02ddc648-fbcc-4f70-91ba-24aa9e3dc16a	d1dce1c9-e82b-4efb-8d22-00117a37b94a	2	3	2026-2027	A
31dc5070-7393-43d2-b7a5-35f694fea4b0	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	2	3	2026-2027	A
4d9db948-3c51-43a7-bb51-62f0e63dfd3e	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	2	3	2026-2027	A
36037c99-faa7-40f4-bd07-c93bc51765ad	e79979e1-326f-4b84-b613-ce32953d1f05	2	3	2026-2027	A
83fc25a6-c50f-4ffb-bed0-2ae7b013d6ad	11c8fe77-61a2-4761-b804-46106525f467	2	3	2026-2027	A
fc0d50d3-1d2d-4705-ad88-cce94460e562	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	2	3	2026-2027	A
75469dae-4788-42a1-9a37-2116aff64309	31743efc-7a80-4efc-957d-dd325851ad8f	2	3	2026-2027	B
7e820b19-6468-40f3-8519-d0139411f52f	39cdd710-8e5b-4a50-9966-f261472dc3c6	2	3	2026-2027	B
8d179812-01b7-4609-b6cf-da87ef7e1f3e	5d8be432-3c03-424a-906b-34abbd8f08f0	2	3	2026-2027	B
cdd3b9f2-63a6-4b44-993e-40dd1020c6d4	270c7b2d-c393-485a-9667-02dee4d0403f	2	3	2026-2027	B
d1443f5a-f348-43fe-ac2f-f26a20d9205d	fa969a8c-dea9-452d-9fe0-e03590643fd0	2	3	2026-2027	B
3b573e91-0e97-4f48-b4c1-2eaa2dc117c8	8eb4c043-6391-4c13-adbb-d77ca1c9dc8e	2	3	2026-2027	B
fff1c660-70a5-4f01-8ccf-3872e60abdd3	58c006d6-3e2c-4baf-a1fa-24bab631786a	2	3	2026-2027	B
1b041dc5-7fe1-4034-8538-b436b196c5e4	b4c659f3-cb6d-4f5f-90ca-e195cde8de00	2	3	2026-2027	B
b2d26193-d971-4c7f-b3c6-b8b7576e7776	ddc2de80-076e-4d20-ad92-7b0ecc067deb	2	3	2026-2027	B
aedab027-4bc2-4a42-b405-163a051108d1	7b87886d-bc7a-4bee-9368-b52ff2101ab1	2	3	2026-2027	B
14f0dccc-f337-40c9-a2e4-a965c5a8f25a	fe695664-7f7d-4902-ac11-4abb6e7fd547	2	3	2026-2027	B
d58a39d2-a75f-4d16-b1b5-8ff8ea1ca148	42747a4d-181c-4e7e-a215-3d228685873c	2	3	2026-2027	B
75fd53c6-5577-4f31-9958-e9e67fa44ac2	36ceeb1e-a893-431c-9d7a-0b30ae5c9646	2	3	2026-2027	B
3ff4d683-0a7d-4b1d-ac3c-07707de486a5	933c1dd7-ba87-4e5c-a905-a4f0454ec677	2	3	2026-2027	B
e696de99-435f-4016-966f-0e1f8863c945	0e9a2426-af70-4908-947f-c819a14ad377	2	3	2026-2027	B
22bd5fb3-973e-40d2-b001-438511f4c17f	130e9031-4b46-4ce9-b1fd-6e49462d0cfd	2	3	2026-2027	B
af2e3805-3e95-4193-ac99-8ec9db3c1e6e	18f60faa-953f-4d47-b858-8c5d78a9b1ba	2	3	2026-2027	B
6135aa64-32c8-4dcd-b6ab-7554367db43e	7dca393c-e374-4fd4-be89-9a7a9c3f4a00	2	3	2026-2027	B
aae60bcb-584f-4f59-b670-d95f9de48d28	b28a336c-146e-43d4-af87-dad6f4f98f09	2	3	2026-2027	B
fc6d55f3-328e-49bd-a35b-bba1b9839651	dc581723-4dbb-48ac-909a-b6854f1d7219	2	3	2026-2027	B
12760ecc-8c92-452e-97cd-53ebf0cba7d1	a9b2336c-9cbe-49d1-abd1-fe75a04c87c6	2	3	2026-2027	B
db15373e-70c0-4c1d-8ef7-161a4d636ab1	a448971c-bfff-49f6-a5d1-99dba7ca6172	2	3	2026-2027	B
b09b1d92-3c22-4a01-ad29-337f510b577c	8dd0359b-1da1-41aa-ada0-3342c623c5b4	2	3	2026-2027	B
db300545-2d77-4b72-b304-b06f7ba8679f	a6a8d329-a29d-41b9-8206-4899ea5c5430	2	3	2026-2027	B
13bd690c-9eee-40b5-8731-4b11a727287b	2925a97c-5364-4fb0-bace-550fdb30f785	2	3	2026-2027	B
708cd37b-88df-4725-ba3b-c4a422d468b6	504a4c9a-95b7-4872-9db9-78483e3e1e60	2	3	2026-2027	A
1a047d34-f789-4e83-9424-144e06a766c1	c827a01f-387c-4c59-bfcd-829297a30a74	2	3	2026-2027	A
dc6ba4bb-2b33-48b0-83f2-63328a9545e9	33a1b435-e6c5-44af-a070-844185ae8aa2	3	5	2026-2027	A
896b5eea-82a0-48c8-8d20-36c674e08b82	d3110109-1689-4d8a-a4f2-ec0853255af3	3	5	2026-2027	A
22d43745-ad88-4b6f-ad45-85d3c8385822	29263da1-2775-4557-8fcc-d2a5164f8987	3	5	2026-2027	A
47d48dbd-5fab-4835-a5b0-48737d1b5d8a	6948728b-506e-4371-9f78-d9eea4c88432	3	5	2026-2027	A
ff54be75-37d5-4ee2-80a8-679479bf92a0	63dbb247-8757-4354-9421-d9f4c9cda5af	3	5	2026-2027	A
9b75575e-632f-4541-aefe-7d93163d5378	7d845671-0935-4065-8572-a8b91f5f95f6	3	5	2026-2027	A
c74a601b-fb11-450c-825e-38ed68ab3870	c5fc71a3-071d-44b3-9e9c-bffb16126064	3	5	2026-2027	A
d95032a2-67de-44c6-9f3d-dfcaaa56f73d	e3cdcecb-1aab-4642-977c-9ddaf8386911	3	5	2026-2027	A
752ce55a-2002-44d0-ad86-b4f18be540c3	0ebea013-f16f-440f-ac52-4d77325c694f	3	5	2026-2027	A
808eaf6c-16ea-492f-8268-349cdc4912c9	5a93e483-f914-49b8-9e36-f68545ee5a6a	3	5	2026-2027	A
e5d6626a-433b-4876-8fbf-998a539dce75	b722a40c-844f-482a-a84c-2d07a90a8ecb	3	5	2026-2027	A
d822b26a-402a-4fba-9094-f6dc189a3c29	50cc254e-e0c8-4a9d-a59e-1faeabc25f44	3	5	2026-2027	A
154841d3-70a4-40cb-9f84-ed02c7d74730	40319cfd-3b35-4384-98ac-7d50eb29dcc7	3	5	2026-2027	A
9b20127e-0332-4b96-8e36-77b9e9f8a428	2e64f093-a856-464f-b34d-52d4f8eb3c78	3	5	2026-2027	A
1481857c-9266-46ab-a5f0-927a380a2707	529b4378-fa58-4d3c-bffb-84a325f042b6	3	5	2026-2027	A
df5434b2-dec0-4651-8058-a114c1e4f977	2af14b44-78e1-4ec2-960a-e11029660d65	3	5	2026-2027	A
3cee308d-76c0-427d-bd14-84187a77b5a0	c5f4e3da-1dfc-4c5e-9987-ca0264885397	3	5	2026-2027	A
fda8789e-601e-4718-bb24-df28907bb195	f1c534f1-11f4-468b-be3a-25823c9a0ec4	3	5	2026-2027	A
9d1d23fd-e19a-4e68-a6e0-e00e6fa43309	5d77cb41-e929-43b1-85c5-bbc75496c95b	3	5	2026-2027	A
5e47bbc3-13c7-454f-bedf-251bfcb58cd7	535f45e3-25a6-4f75-8746-b92a3bed87ea	3	5	2026-2027	A
5e7b479c-5105-4d94-9c5d-d0473da9457d	0c214219-2412-408e-9a11-5e087f5361ba	3	5	2026-2027	A
c174a6b5-df6e-4c2f-8af4-c5020aeb7f46	dc039b49-e449-4487-bf50-b6cba344de03	3	5	2026-2027	A
38caebc3-efad-4043-ab5e-22504629b90e	768666a7-46ff-449f-912c-025c29d7e9bb	3	5	2026-2027	A
5491acec-c819-48d2-aba8-bee20072959d	600aa6e2-68f5-4576-86eb-6f6331edb45a	3	5	2026-2027	A
d14d6d6a-0948-4a20-b37e-44dcf7e16338	18a5c0b8-37b2-4350-adb3-54214a85e630	3	5	2026-2027	A
201850da-bdba-45d9-8115-02998f4150c9	ffa605bf-83f6-4cf1-8e53-e552b0926053	3	5	2026-2027	B
7114ec00-64f1-43af-9373-163e8c3ceee3	886dbe27-1de9-49d3-9107-cf9d7fbb0673	3	5	2026-2027	B
a8ab7b3e-a889-4a38-8736-e732f8d8881d	1c95452e-7094-4393-a18b-fbe1a743d9bb	3	5	2026-2027	B
a665bfdf-8c1d-4f11-8b73-058299d204a5	8f2721bc-0e3f-4900-a2a3-98e8e899d795	3	5	2026-2027	B
fcffce10-f555-414f-951a-094aa0ab73bb	ec973db4-b310-46ec-893b-2afbea2a126b	3	5	2026-2027	B
a434493e-9432-4300-a59b-17924cad3571	88fe0ea0-df61-4517-8294-3d4a999d12a5	3	5	2026-2027	B
f8e57c39-a986-4b41-8f60-03b7b210551d	dde09176-04cb-4454-a259-38452376cc5a	3	5	2026-2027	B
7d4973b8-6de3-4f82-8cdd-37d1641f1aff	1c9dce7e-ab84-402e-b13b-15f32554b527	3	5	2026-2027	B
a1cdd59a-0fed-4aa8-a8c1-6e6317a8fcf5	c19dc115-56db-4d12-830d-5ee66029de79	3	5	2026-2027	B
af102c1b-ee84-469f-afb0-d74deb22ddc1	5e5b352c-d716-4f9d-b9d7-c2d9842f9723	3	5	2026-2027	B
fcb87681-2195-4c4c-b889-9e929912f637	4538cab4-dc5b-495a-97d3-db4101377fe6	3	5	2026-2027	B
f541b21e-1e63-44c4-9b84-6fb63bec691e	8e59ff7f-b31c-482b-836c-720caf5e727e	3	5	2026-2027	B
91503e6d-d06f-4f9e-8fa8-2dc9c87321fc	600cdbf2-5a7d-423b-9e05-a8cecf25b338	3	5	2026-2027	B
2611aee3-db2b-40a4-aa09-e89f3f784d07	c2bce4db-8126-4b66-9530-8e3988343bce	3	5	2026-2027	B
33c9c195-01ca-41b8-ba49-f0172f4365da	d1fa3414-314d-4687-9f41-b6851bd0e903	3	5	2026-2027	B
e9da56c3-6554-4fef-8bf4-67f8e285df99	e253f0b1-0cd3-43f7-b8ce-8be1f46b571f	3	5	2026-2027	B
6d8bfb3d-408d-4eaa-847f-858491aaa53b	a78eb282-ff96-4abe-b0af-0382ba562c7d	3	5	2026-2027	B
c3e438cc-6ea2-4b03-b7e3-1e41e97b0261	860139be-85f8-4cab-b576-1cf41eeadc4b	3	5	2026-2027	B
cb4c6bc9-cfac-4390-bffc-2c3b7f0e7b16	da5eeda2-d919-407b-8f55-0865b57e8c94	3	5	2026-2027	B
dbb71e05-c6db-4a4b-8853-27664225606c	21ebdada-3ed0-47d9-a6a4-7f060c20fa0f	3	5	2026-2027	B
a9ae49dd-3021-4f9e-af9e-0416a4665a72	de234f31-cfde-44ab-99ef-c2a288e4ffe5	3	5	2026-2027	B
40f80ab7-7986-4e92-a1a2-fab4d4e7f7a8	f240b7b2-476f-4299-8b7d-254a2092e8f5	3	5	2026-2027	B
0cd688e6-c548-4804-a77a-f4458a16cc2f	35c3a49b-bff4-4246-b70a-55eb55b423f0	3	5	2026-2027	B
44eb5ebd-7f89-4343-99a0-675ad23e41d4	2a68a130-870d-4f63-b578-3e3cdb3ddfab	3	5	2026-2027	B
b873d055-fc6e-4b44-8f61-08e8e0986a64	49759c5f-2b3e-4c6e-82f1-2586918a80b9	3	5	2026-2027	B
\.


--
-- Data for Name: FeedbackFormLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FeedbackFormLog" (id, "departmentId", "formLink", "sentAt", "sentBy", "recipientCount") FROM stdin;
bb5b37f8-8cbc-4f87-adff-8b4f0d3cbf19	f64e716c-0a08-453f-9703-31f51cb8d7da	https://docs.google.com/forms/d/e/1FAIpQLSezV680VmZEmHk5OXIuYjKP_dHi4TcuhTR-gmfm1NK4gWOmgA/viewform?usp=publish-editor	2026-03-08 07:20:56.379	1979fcda-166b-438a-b2a1-a837d3c4511c	3
\.


--
-- Data for Name: Institute; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Institute" (id, "principalId") FROM stdin;
\.


--
-- Data for Name: Mark; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Mark" (id, "studentId", "subjectOfferingId", "examType", marks) FROM stdin;
97caccbc-4dba-4500-878b-50b2c93df161	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	49
5bb5f073-f9f9-4147-894b-da43ca4cc858	ab8d6a3a-8889-442c-996e-15825a25e37f	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	50
48556d7a-d246-452e-bc02-961aa53aa76d	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	3
440fefb2-f440-4d7a-b414-e20646e8445a	ae753320-c362-4d8b-8294-53533a1a5798	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	72
f44b071f-0441-4281-9acc-020b8964d8af	f1719575-4aea-4b3e-a61c-b8307ccf9516	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	74
6a204a9e-6bbe-4115-902f-84e20e3a7d49	128691dd-ff65-43d8-8bf4-bb59e2e58617	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	70
39e8d799-b6bd-4abb-aa94-2c68e702ebcc	65ef7119-ea28-4a7a-9329-fcef962e4343	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	60
92b26e8d-e824-4899-93b1-2c7ad8867940	c1c97976-38c1-4174-b028-57b0273c7fac	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	80
27a56fc4-b4f5-4e9a-97f6-5e8fb63bec00	fd519d52-433b-4bf7-8e7d-e18caeccf843	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	81
83a71bbe-3d4a-4962-bb3b-622a07986b5f	f3575bed-7b01-4358-bdf2-3d1f81cc2515	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	82
901ee9a4-1db6-4b98-b1be-984b743cd232	95465124-34e6-4104-95f7-2f6289016331	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	74
70cf4a32-186c-4669-ac6a-5dd94504c5ab	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	86
52aaff51-6fc5-4e30-b3e3-61da30db370f	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	85
360d3b89-0366-46e9-9424-5c68b81f9a89	a78272dc-151f-400f-a0b4-1eeec317739c	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	36
e602396c-2c34-4f67-ab9d-66365b02289d	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	40
63454ba0-efe6-41ca-b265-d20a5d8a9780	47d8c413-5440-4d05-90cb-0757217fdfaf	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	47
2184c0a7-9f1f-432d-bd4e-5953728224a5	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	52
1fea2686-57db-469f-92c8-688ee8ac5061	d1dce1c9-e82b-4efb-8d22-00117a37b94a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	58
1a1f80a8-e4e6-4bc8-bfdb-e39a7c524060	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	59
97a25aff-c794-4a10-a145-2358143dcebe	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	69
b7deea7f-c364-45bf-8f0d-deceaac36e70	e79979e1-326f-4b84-b613-ce32953d1f05	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	76
ed105310-7235-4e26-8715-44926112f6d3	11c8fe77-61a2-4761-b804-46106525f467	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	74
6fec2267-881e-4c86-9fdb-09d02d5b9a38	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	93
90fb72b5-96b7-4ae4-9f24-defc78d2b2e6	504a4c9a-95b7-4872-9db9-78483e3e1e60	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	100
addc1d61-a493-4ec8-ab47-a9c990ced026	c827a01f-387c-4c59-bfcd-829297a30a74	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-1	97
96b6cdcb-bb07-4564-800b-53f71f4012c4	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	12
6e1fb509-091b-4721-a36f-f1d69e8294d2	ab8d6a3a-8889-442c-996e-15825a25e37f	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	32
fdaac507-a96c-4bd7-9ad0-2d2e35a38021	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	65
63b874ab-d1a3-45e0-8cde-c6b3d2f3a239	ae753320-c362-4d8b-8294-53533a1a5798	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	54
e3ea3de7-344c-4444-bc32-7f5944d461cc	f1719575-4aea-4b3e-a61c-b8307ccf9516	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	79
f75b2725-b53a-4852-b9ca-ecf007615eb2	128691dd-ff65-43d8-8bf4-bb59e2e58617	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	43
9685b40b-27c0-4f58-81d0-61b2bdea00e0	65ef7119-ea28-4a7a-9329-fcef962e4343	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	91
6e61a2cc-abb0-4d62-945f-3c7e60cb4355	c1c97976-38c1-4174-b028-57b0273c7fac	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	27
d4c82604-588c-4f01-b427-f5d36a29326d	fd519d52-433b-4bf7-8e7d-e18caeccf843	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	68
0cd48fa6-ce3f-4b87-ab44-a97f59eb4161	f3575bed-7b01-4358-bdf2-3d1f81cc2515	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	35
6cbb7123-8376-4e34-8ccc-b216daad63dc	95465124-34e6-4104-95f7-2f6289016331	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	74
0097ceae-acc1-47ea-a26c-e642d61f3322	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	18
0a7a68d0-f00d-4224-a82f-e15f1edf4410	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	83
1035d23f-7187-4648-931e-868349c33179	a78272dc-151f-400f-a0b4-1eeec317739c	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	59
1ad2b52e-64f3-471e-9798-15cd7b1a6803	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	41
9040d374-852d-4e76-afe0-df63adae4524	47d8c413-5440-4d05-90cb-0757217fdfaf	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	96
48667532-c8f6-42b6-a6fa-55320e20f2b9	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	23
781eeccf-49b1-4d0a-a52f-721da0c20b23	d1dce1c9-e82b-4efb-8d22-00117a37b94a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	77
0630deb5-31af-42a3-a3e4-0165890e12c1	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	62
bfa7e745-46fc-48a2-851f-b1bbdaf31e47	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	15
e4a339e6-d6db-4abb-bfb0-e77cdd0e75a4	e79979e1-326f-4b84-b613-ce32953d1f05	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	88
7a055cde-dc63-4231-addf-2401664d2350	11c8fe77-61a2-4761-b804-46106525f467	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	49
1d41b771-6b06-4d4c-9c17-90dac14351ba	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	70
3c6e985b-f689-4f2b-88de-a376ae62b48c	504a4c9a-95b7-4872-9db9-78483e3e1e60	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	56
7253afc8-c45b-48ee-98bf-c46f73068e1d	c827a01f-387c-4c59-bfcd-829297a30a74	7e589f4c-041c-4721-8823-937f9a38f058	Sessional-2	94
9fdadd6d-61e2-49a6-96aa-8ee9e288eaff	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	46
60a813c0-2fac-442a-9481-f7c5b312fdc2	ab8d6a3a-8889-442c-996e-15825a25e37f	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	82
dca09367-894b-48f2-83ed-43935b3f6d8f	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	19
233562d5-5cf0-47fa-8198-d94b1001517f	ae753320-c362-4d8b-8294-53533a1a5798	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	73
470be5ea-e073-41f9-b5aa-eac43a5fb30f	f1719575-4aea-4b3e-a61c-b8307ccf9516	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	55
6508b7e9-f7a4-476b-aa6a-e6e49e0f3a3f	128691dd-ff65-43d8-8bf4-bb59e2e58617	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	91
ac186857-5994-4a9a-9e39-7fbd4a7198b0	65ef7119-ea28-4a7a-9329-fcef962e4343	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	34
07376091-201c-4f7c-aa02-cea1b3e47813	c1c97976-38c1-4174-b028-57b0273c7fac	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	67
89ca92b8-92d3-40aa-a9e7-bd24a472bebe	fd519d52-433b-4bf7-8e7d-e18caeccf843	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	28
f14de6b1-4241-49ba-b9c1-2d342741a9ce	f3575bed-7b01-4358-bdf2-3d1f81cc2515	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	64
56c6e8d5-0785-47a7-86e6-70cf1bf4b409	95465124-34e6-4104-95f7-2f6289016331	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	12
a773422c-356e-4827-aecf-00a8b9ec7554	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	97
8a675e75-3b40-45a4-a601-d290170f4459	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	41
e2cc3840-844b-4e33-8355-eb0e655e21ff	a78272dc-151f-400f-a0b4-1eeec317739c	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	76
d442c3ff-184c-40eb-967f-e7c011982169	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	53
19ce3e6f-355f-4734-8ecc-b06d49d3d548	47d8c413-5440-4d05-90cb-0757217fdfaf	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	88
89eabf75-3c8f-49d8-b8e0-ecbe7da4fbe0	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	25
d72e4814-2278-48b7-a580-7be92c501ce8	d1dce1c9-e82b-4efb-8d22-00117a37b94a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	69
db7c05c6-6743-4cd6-ba52-16ba534deaaf	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	31
355dda99-0bda-484a-ab4e-3c3aa592d9a3	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	84
9ba1592e-6f21-4710-8d36-261ee151853c	e79979e1-326f-4b84-b613-ce32953d1f05	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	58
9fa018c2-cf95-4e8e-b3f0-1c287058970b	11c8fe77-61a2-4761-b804-46106525f467	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	14
1d697a98-e0ec-4c94-a05f-a9f80de33be7	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	72
3b62c1b6-66ab-4aac-bf86-932804c89f9d	504a4c9a-95b7-4872-9db9-78483e3e1e60	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	39
3c1659f2-a59c-45f8-9485-5e8d4a66e793	c827a01f-387c-4c59-bfcd-829297a30a74	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-1	95
8400fc69-47ea-4180-acf2-4d02a90d6bf6	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	84
376e252f-628d-40f9-a18b-ec4761c01e43	ab8d6a3a-8889-442c-996e-15825a25e37f	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	17
052bc6aa-7e0f-4cef-9215-c7aac16e0b3c	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	63
e1cc996b-f824-44bd-b0e4-c16eccb97e47	ae753320-c362-4d8b-8294-53533a1a5798	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	29
15e17da1-2870-477a-9f2a-db958dd9696f	f1719575-4aea-4b3e-a61c-b8307ccf9516	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	91
7274e434-c357-49c8-a211-171f629eca72	128691dd-ff65-43d8-8bf4-bb59e2e58617	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	45
32e24eda-44f1-4005-9503-5f616294bc3d	65ef7119-ea28-4a7a-9329-fcef962e4343	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	72
3d0d4c8b-933d-4176-8431-387271775f0b	c1c97976-38c1-4174-b028-57b0273c7fac	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	38
e437a59b-3de0-450a-b467-4a70180e46d9	fd519d52-433b-4bf7-8e7d-e18caeccf843	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	56
e0c60b44-c548-493a-ab33-9d74820481d1	f3575bed-7b01-4358-bdf2-3d1f81cc2515	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	99
3a16c009-00b3-490a-a3bd-b87be97fe668	95465124-34e6-4104-95f7-2f6289016331	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	14
21d0125d-f87f-43fc-9f9b-4dc8660312f8	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	67
94ad52ea-0615-4271-b90f-eae0aaa475dd	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	23
e9a3cdb2-9bbe-4d8d-b812-142750e272b1	a78272dc-151f-400f-a0b4-1eeec317739c	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	88
9b9c8f2b-9dd9-440d-8c3b-8793c7e94be7	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	41
fd0d5167-a61d-4cac-ba2f-4d2fc9988a50	47d8c413-5440-4d05-90cb-0757217fdfaf	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	75
043253fb-7e47-4761-8910-3f7822f74117	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	32
6c4a5a7a-0bfe-468d-ba3a-337342b61c2a	d1dce1c9-e82b-4efb-8d22-00117a37b94a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	59
486ed13e-1571-4337-b18b-ff850605ef59	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	96
de47e2e7-625e-4637-8758-5153f67f79d9	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	21
3a07eb32-8397-415c-965d-215ae3e91b2b	e79979e1-326f-4b84-b613-ce32953d1f05	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	47
be57027c-0f7f-4037-a401-81d9ac494822	11c8fe77-61a2-4761-b804-46106525f467	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	83
1ff55eb4-12fe-4a4c-aad7-1ee022f39d6c	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	68
5f6fb1d6-94b7-4019-87b4-e9d0011ea22a	504a4c9a-95b7-4872-9db9-78483e3e1e60	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	35
b4774986-4d2f-42f2-a126-9bd180a52139	c827a01f-387c-4c59-bfcd-829297a30a74	4b5e7526-c9f2-4091-9e25-e72f797d7bc9	Sessional-2	52
\.


--
-- Data for Name: Profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Profile" (id, "userId", "fullName", phone, bio, address, designation, experience, "joiningDate", "profilePhoto", qualifications) FROM stdin;
1198aa75-d6d2-4bac-9553-1c5a99518a1a	ce7474b5-e7d1-416a-afc2-38ddd95a09f5	Satvik Deshmukh	\N	\N	\N	\N	\N	\N	\N	\N
1e29e975-f83a-47e9-80bb-8a8510bcc908	d14d6786-0ed4-4b81-884d-f5c246b26c70	Sanika Gadekar	\N	\N	\N	\N	\N	\N	\N	\N
48c2d9db-54af-4ba5-8b83-73ce44b4c0e4	39ab55cf-f18a-4dae-87aa-4feaea025a2c	Mayank Gaur	\N	\N	\N	\N	\N	\N	\N	\N
ea26a372-24b5-4338-b829-69360b25aefc	9c4527f4-0139-4c1c-b753-3c5178799cb4	Yash Bakde	\N	\N	\N	\N	\N	\N	\N	\N
de992e32-5157-4847-9c8d-82ac3ee5326b	822698d0-3547-4833-a3c7-93f29f45430c	Ankita Deshmukh	\N	\N	\N	\N	\N	\N	\N	\N
05dff3d4-15bf-48db-aade-fe2075d679d2	17c7bfc3-ea1a-46a2-a599-91bf9e0f4d9a	Vinod JI	9281987982			Principal			/uploads/photos/photo_17c7bfc3-ea1a-46a2-a599-91bf9e0f4d9a_1772957326837.jpg	
2657da41-955b-4ae2-aca3-bcd2d7829cec	1979fcda-166b-438a-b2a1-a837d3c4511c	System Admin	\N	\N	Amravati	System Administrator	2	\N	\N	B.E
d777efd2-853c-4e95-bbb3-40b8ab3c04fc	d52301d5-d9a4-4d66-ba12-dead4e77134c	Satvik	7894561237	A very passionate and enthusiastic individual working on delivering exclusive knowledge to the students and also gain credible experience through-out the career.	Amravati	Assistant Professor	5	1-Mar-2025	\N	B.E
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Report" (id, "userId", title, content, "createdAt", status) FROM stdin;
5dd78456-1288-4008-9cef-7a1c3efe2859	d52301d5-d9a4-4d66-ba12-dead4e77134c	Final Class Report — Data Structures And Algorithms	{"type":"class","offeringId":"0df28c26-e35e-42be-afbd-99f35b3ec901","subjectName":"Data Structures And Algorithms","remarks":""}	2026-03-09 18:11:40.417	forwarded
341ea764-bb87-4a3b-b425-caa32e2c3071	d52301d5-d9a4-4d66-ba12-dead4e77134c	Draft Class Report — Data Structures And Algorithms	{"type":"class","offeringId":"0df28c26-e35e-42be-afbd-99f35b3ec901","subjectName":"Data Structures And Algorithms","remarks":""}	2026-03-09 18:11:44.514	draft
1a67a4b7-5a4f-4f34-8f57-17eee29ec641	d52301d5-d9a4-4d66-ba12-dead4e77134c	Final Report — Meera Joshi	{"type":"student","studentId":"6202e710-7b3f-4151-8627-7e4f5bca495f","remarks":"","subjectIds":["0df28c26-e35e-42be-afbd-99f35b3ec901","a5444cb1-e475-4a13-98d7-1d64b1b76602","baa9978e-749c-4c6b-b970-b240832443dc"]}	2026-03-09 18:12:00.067	forwarded
7611038d-fbc8-4e05-a064-8eed6d7e873f	d52301d5-d9a4-4d66-ba12-dead4e77134c	Draft Report — Meera Joshi	{"type":"student","studentId":"6202e710-7b3f-4151-8627-7e4f5bca495f","remarks":"","subjectIds":["0df28c26-e35e-42be-afbd-99f35b3ec901","a5444cb1-e475-4a13-98d7-1d64b1b76602","baa9978e-749c-4c6b-b970-b240832443dc"]}	2026-03-09 18:12:01.65	draft
cd56ce9d-bf6a-45f8-81f0-c893607883a3	d52301d5-d9a4-4d66-ba12-dead4e77134c	Draft Class Report — Data Structures And Algorithms	{"type":"class","offeringId":"0df28c26-e35e-42be-afbd-99f35b3ec901","subjectName":"Data Structures And Algorithms","remarks":""}	2026-03-09 18:12:10.525	submitted_to_principal
a2d119f2-622f-409f-b4c9-abd37c26cd91	d52301d5-d9a4-4d66-ba12-dead4e77134c	Draft Report - Sana Kapoor	{"type":"student","studentId":"01bf181e-c39c-4165-ad89-f7df7402e0f4","studentName":"Sana Kapoor","templateId":"classic","remarks":"","subjectIds":["0d4ed7dc-043d-4656-bbf7-1a80fb2a680a","731a86f2-da65-4d93-a8c0-22a1c85c8630","233f2363-2c56-494a-a9d4-e58681ad7c1d"]}\n\n--- Notes ---\nDemo1	2026-03-06 04:27:42.334	submitted_to_principal
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Student" (id, "studentId", "fullName", "departmentId", "createdAt", email) FROM stdin;
31743efc-7a80-4efc-957d-dd325851ad8f	STU226	Prisha More	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.972	prishamore@gmail.com
39cdd710-8e5b-4a50-9966-f261472dc3c6	STU227	Ishan Pawar	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.976	ishanpawar@gmail.com
5d8be432-3c03-424a-906b-34abbd8f08f0	STU228	Riya Jadhav	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.98	riyajadhav@gmail.com
270c7b2d-c393-485a-9667-02dee4d0403f	STU229	Krishna Bhosale	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.984	krishnabhosale@gmail.com
fa969a8c-dea9-452d-9fe0-e03590643fd0	STU230	Ira Kale	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.989	irakale@gmail.com
8eb4c043-6391-4c13-adbb-d77ca1c9dc8e	STU231	Arnav Gawande	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.994	arnavgawande@gmail.com
58c006d6-3e2c-4baf-a1fa-24bab631786a	STU232	Aanya Vyas	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.999	aanyavyas@gmail.com
b4c659f3-cb6d-4f5f-90ca-e195cde8de00	STU233	Aarav Tiwari	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.004	aaravtiwari@gmail.com
ddc2de80-076e-4d20-ad92-7b0ecc067deb	STU234	Shanaya Thakur	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.009	shanayathakur@gmail.com
7b87886d-bc7a-4bee-9368-b52ff2101ab1	STU235	Dhruv Patwardhan	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.014	dhruvpatwardhan@gmail.com
fe695664-7f7d-4902-ac11-4abb6e7fd547	STU236	Rishaan Yadav	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.019	rishaanyadav@gmail.com
42747a4d-181c-4e7e-a215-3d228685873c	STU237	Kabir Pandey	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.025	kabirpandey@gmail.com
36ceeb1e-a893-431c-9d7a-0b30ae5c9646	STU238	Anvi Dubey	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.03	anvidubey@gmail.com
933c1dd7-ba87-4e5c-a905-a4f0454ec677	STU239	Sai Mishra	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.035	saimishra@gmail.com
0e9a2426-af70-4908-947f-c819a14ad377	STU240	Aavya Chaturvedi	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.04	aavyachaturvedi@gmail.com
130e9031-4b46-4ce9-b1fd-6e49462d0cfd	STU241	Agastya Saxena	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.045	agastyasaxena@gmail.com
18f60faa-953f-4d47-b858-8c5d78a9b1ba	STU242	Anika Srivastava	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.05	anikasrivastava@gmail.com
7dca393c-e374-4fd4-be89-9a7a9c3f4a00	STU243	Advik Banerjee	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.055	advikbanerjee@gmail.com
b28a336c-146e-43d4-af87-dad6f4f98f09	STU244	Avni Mukherjee	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.059	avnimukherjee@gmail.com
dc581723-4dbb-48ac-909a-b6854f1d7219	STU245	Yuvan Chatterjee	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.065	yuvanchatterjee@gmail.com
a9b2336c-9cbe-49d1-abd1-fe75a04c87c6	STU246	Kaira Bose	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.07	kairabose@gmail.com
a448971c-bfff-49f6-a5d1-99dba7ca6172	STU247	Aarush Das	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.075	aarushdas@gmail.com
8dd0359b-1da1-41aa-ada0-3342c623c5b4	STU248	Vanya Sen	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.08	vanyasen@gmail.com
a6a8d329-a29d-41b9-8206-4899ea5c5430	STU249	Ishaan Roy	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.085	ishaanroy@gmail.com
2925a97c-5364-4fb0-bace-550fdb30f785	STU250	Pari Dutta	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:25.089	paridutta@gmail.com
ab8d6a3a-8889-442c-996e-15825a25e37f	STU202	Rohan Sharma	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.854	rohansharma@gmail.com
29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	STU203	Sneha Singh	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.861	snehasingh@gmail.com
ae753320-c362-4d8b-8294-53533a1a5798	STU204	Ananya Gupta	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.867	ananyagupta@gmail.com
f1719575-4aea-4b3e-a61c-b8307ccf9516	STU205	Arjun Verma	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.873	arjunverma@gmail.com
128691dd-ff65-43d8-8bf4-bb59e2e58617	STU206	Ishita Malhotra	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.879	ishitamalhotra@gmail.com
65ef7119-ea28-4a7a-9329-fcef962e4343	STU207	Kabir Kapoor	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.886	kabirkapoor@gmail.com
c1c97976-38c1-4174-b028-57b0273c7fac	STU208	Myra Khan	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.892	myrakhan@gmail.com
fd519d52-433b-4bf7-8e7d-e18caeccf843	STU209	Veer Iyer	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.898	veeriyer@gmail.com
f3575bed-7b01-4358-bdf2-3d1f81cc2515	STU210	Diya Reddy	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.903	diyareddy@gmail.com
95465124-34e6-4104-95f7-2f6289016331	STU211	Aryan Joshi	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.908	aryanjoshi@gmail.com
339504cb-dc37-4d3d-b65d-a79fa3e6b57a	STU212	Saanvi Patil	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.912	saanvipatil@gmail.com
80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	STU213	Vivaan Deshmukh	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.917	vivaandeshmukh@gmail.com
a78272dc-151f-400f-a0b4-1eeec317739c	STU214	Zara Kulkarni	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.92	zarakulkarni@gmail.com
a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	STU215	Advait Rao	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.924	advaitrao@gmail.com
47d8c413-5440-4d05-90cb-0757217fdfaf	STU216	Kyra Shah	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.929	kyrashah@gmail.com
0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	STU217	Vihaan Mehta	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.933	vihaanmehta@gmail.com
d1dce1c9-e82b-4efb-8d22-00117a37b94a	STU218	Amaira Nair	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.937	amairanair@gmail.com
bc6a661e-2eaf-4330-bde0-fc493c4d7cae	STU219	Ayaan Pillai	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.941	ayaanpillai@gmail.com
6c8c493d-ebd6-4c7a-bda8-c5d64140f548	STU220	Kiara Menon	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.945	kiaramenon@gmail.com
11c8fe77-61a2-4761-b804-46106525f467	STU222	Navya Trivedi	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.954	navyatrivedi@gmail.com
6be6dea2-284d-48a5-b0ff-3701a1f66e9a	STU223	Atharva Gandhi	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.958	atharvagandhi@gmail.com
504a4c9a-95b7-4872-9db9-78483e3e1e60	STU224	Ira Patel	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.962	irapatel@gmail.com
c827a01f-387c-4c59-bfcd-829297a30a74	STU225	Reyansh Shinde	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.966	reyanshshinde@gmail.com
a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	STU201	Rahul Kumar	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.802	rahulkumar@gmail.com
e79979e1-326f-4b84-b613-ce32953d1f05	STU221	Shaurya Bhatt	f64e716c-0a08-453f-9703-31f51cb8d7da	2026-03-09 18:19:24.949	shauryabhatt@gmail.com
33a1b435-e6c5-44af-a070-844185ae8aa2	STU101	Aarav Sharma	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.271	aaravsharma@gmail.com
d3110109-1689-4d8a-a4f2-ec0853255af3	STU102	Vivaan Patel	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.292	vivaanpatel@gmail.com
29263da1-2775-4557-8fcc-d2a5164f8987	STU103	Aditya Rao	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.298	adityarao@gmail.com
6948728b-506e-4371-9f78-d9eea4c88432	STU104	Vihaan Gupta	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.304	vihaangupta@gmail.com
63dbb247-8757-4354-9421-d9f4c9cda5af	STU105	Arjun Mehta	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.31	arjunmehta@gmail.com
7d845671-0935-4065-8572-a8b91f5f95f6	STU106	Sai Kulkarni	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.316	saikulkarni@gmail.com
c5fc71a3-071d-44b3-9e9c-bffb16126064	STU107	Rohan Deshmukh	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.32	rohandeshmukh@gmail.com
e3cdcecb-1aab-4642-977c-9ddaf8386911	STU108	Kunal Patil	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.325	kunalpatil@gmail.com
0ebea013-f16f-440f-ac52-4d77325c694f	STU109	Rahul Verma	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.329	rahulverma@gmail.com
5a93e483-f914-49b8-9e36-f68545ee5a6a	STU110	Aman Singh	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.334	amansingh@gmail.com
b722a40c-844f-482a-a84c-2d07a90a8ecb	STU111	Neha Joshi	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.338	nehajoshi@gmail.com
50cc254e-e0c8-4a9d-a59e-1faeabc25f44	STU112	Sneha Chavan	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.342	snehachavan@gmail.com
40319cfd-3b35-4384-98ac-7d50eb29dcc7	STU113	Pooja Patil	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.347	poojapatil@gmail.com
2e64f093-a856-464f-b34d-52d4f8eb3c78	STU114	Ananya Sharma	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.351	ananyasharma@gmail.com
529b4378-fa58-4d3c-bffb-84a325f042b6	STU115	Isha Gupta	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.355	ishagupta@gmail.com
2af14b44-78e1-4ec2-960a-e11029660d65	STU116	Riya Mehta	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.359	riyamehta@gmail.com
c5f4e3da-1dfc-4c5e-9987-ca0264885397	STU117	Divya Kulkarni	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.363	divyakulkarni@gmail.com
f1c534f1-11f4-468b-be3a-25823c9a0ec4	STU118	Sana Kapoor	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.367	sanakapoor@gmail.com
5d77cb41-e929-43b1-85c5-bbc75496c95b	STU119	Kavya Nair	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.371	kavyanair@gmail.com
535f45e3-25a6-4f75-8746-b92a3bed87ea	STU120	Priya Desai	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.375	priyadesai@gmail.com
0c214219-2412-408e-9a11-5e087f5361ba	STU121	Omkar Jadhav	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.379	omkarjadhav@gmail.com
dc039b49-e449-4487-bf50-b6cba344de03	STU122	Siddharth Shinde	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.383	siddharthshinde@gmail.com
768666a7-46ff-449f-912c-025c29d7e9bb	STU123	Harsh Vyas	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.387	harshvyas@gmail.com
600aa6e2-68f5-4576-86eb-6f6331edb45a	STU124	Manav Shah	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.391	manavshah@gmail.com
18a5c0b8-37b2-4350-adb3-54214a85e630	STU125	Yash Thakur	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.395	yashthakur@gmail.com
ffa605bf-83f6-4cf1-8e53-e552b0926053	STU126	Aryan Tiwari	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.399	aryantiwari@gmail.com
886dbe27-1de9-49d3-9107-cf9d7fbb0673	STU127	Tanvi Patwardhan	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.403	tanvipatwardhan@gmail.com
1c95452e-7094-4393-a18b-fbe1a743d9bb	STU128	Mitali Pawar	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.407	mitalipawar@gmail.com
8f2721bc-0e3f-4900-a2a3-98e8e899d795	STU129	Komal Yadav	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.411	komalyadav@gmail.com
ec973db4-b310-46ec-893b-2afbea2a126b	STU130	Nikita More	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.415	nikitamore@gmail.com
88fe0ea0-df61-4517-8294-3d4a999d12a5	STU131	Vedant Patil	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.419	vedantpatil@gmail.com
dde09176-04cb-4454-a259-38452376cc5a	STU132	Atharva Kulkarni	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.424	atharvakulkarni@gmail.com
1c9dce7e-ab84-402e-b13b-15f32554b527	STU133	Tejas Bhosale	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.428	tejasbhosale@gmail.com
c19dc115-56db-4d12-830d-5ee66029de79	STU134	Soham Kale	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.432	sohamkale@gmail.com
5e5b352c-d716-4f9d-b9d7-c2d9842f9723	STU135	Pratik Gawande	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.436	pratikgawande@gmail.com
4538cab4-dc5b-495a-97d3-db4101377fe6	STU136	Sakshi Shinde	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.44	sakshishinde@gmail.com
8e59ff7f-b31c-482b-836c-720caf5e727e	STU137	Aditi Deshmukh	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.447	aditideshmukh@gmail.com
600cdbf2-5a7d-423b-9e05-a8cecf25b338	STU138	Vaishnavi Patil	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.453	vaishnavipatil@gmail.com
c2bce4db-8126-4b66-9530-8e3988343bce	STU139	Rutuja Jagtap	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.458	rutujajagtap@gmail.com
d1fa3414-314d-4687-9f41-b6851bd0e903	STU140	Shruti Kulkarni	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.462	shrutikulkarni@gmail.com
e253f0b1-0cd3-43f7-b8ce-8be1f46b571f	STU141	Akash Pawar	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.467	akashpawar@gmail.com
a78eb282-ff96-4abe-b0af-0382ba562c7d	STU142	Nikhil Patil	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.472	nikhilpatil@gmail.com
860139be-85f8-4cab-b576-1cf41eeadc4b	STU143	Mayur Deshmukh	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.476	mayurdeshmukh@gmail.com
da5eeda2-d919-407b-8f55-0865b57e8c94	STU144	Swapnil Jadhav	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.481	swapniljadhav@gmail.com
21ebdada-3ed0-47d9-a6a4-7f060c20fa0f	STU145	Ritesh Sharma	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.485	riteshsharma@gmail.com
de234f31-cfde-44ab-99ef-c2a288e4ffe5	STU146	Pallavi More	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.49	pallavimore@gmail.com
f240b7b2-476f-4299-8b7d-254a2092e8f5	STU147	Rashmi Patil	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.494	rashmipatil@gmail.com
35c3a49b-bff4-4246-b70a-55eb55b423f0	STU148	Deepak Yadav	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.499	deepakyadav@gmail.com
2a68a130-870d-4f63-b578-3e3cdb3ddfab	STU149	Gaurav Gupta	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.503	gauravgupta@gmail.com
49759c5f-2b3e-4c6e-82f1-2586918a80b9	STU150	Ankita Deshmukh	dc726e53-c910-4fdd-9f1d-92e401e45844	2026-03-09 18:30:53.507	ankitadeshmukh@gmail.com
\.


--
-- Data for Name: Subject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subject" (id, name, code, "departmentId", type, semester, year) FROM stdin;
259328f9-048d-4c2c-81fd-eefb917748c0	Mathematics-3	M3	f64e716c-0a08-453f-9703-31f51cb8d7da	THEORY	3	2
a628b1e7-03f6-4054-90eb-81f05a341117	Discrete Structures And Graph Theory	DSGT	f64e716c-0a08-453f-9703-31f51cb8d7da	THEORY	3	2
7dc85c77-23a0-49e9-bdfb-b06a0f0e4da9	Assembly Language Programming	ALP	f64e716c-0a08-453f-9703-31f51cb8d7da	THEORY	3	2
440c358d-5e20-46ae-86eb-1fb02903c511	Object Oriented Programming	OOP	f64e716c-0a08-453f-9703-31f51cb8d7da	THEORY	3	2
\.


--
-- Data for Name: SubjectEnrollment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubjectEnrollment" (id, "studentId", "subjectOfferingId") FROM stdin;
7acf1e23-ab21-454a-a8f3-3794152cbe57	ab8d6a3a-8889-442c-996e-15825a25e37f	7e589f4c-041c-4721-8823-937f9a38f058
22998943-2e8c-4720-ae3d-6c760858e0bf	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	7e589f4c-041c-4721-8823-937f9a38f058
c9313ed0-1b1f-40d9-b3e9-ac62e6ab53df	ae753320-c362-4d8b-8294-53533a1a5798	7e589f4c-041c-4721-8823-937f9a38f058
6f4ac1c4-7dc2-4949-ba27-0b0f8c822dbe	f1719575-4aea-4b3e-a61c-b8307ccf9516	7e589f4c-041c-4721-8823-937f9a38f058
70faf593-bc5c-43ef-8f01-ebcb611e51da	128691dd-ff65-43d8-8bf4-bb59e2e58617	7e589f4c-041c-4721-8823-937f9a38f058
8e8de144-ec37-4edd-81c3-c0ba6f04c7b4	65ef7119-ea28-4a7a-9329-fcef962e4343	7e589f4c-041c-4721-8823-937f9a38f058
5bfb5f5c-c956-4c12-bbc6-06289c02f3c9	c1c97976-38c1-4174-b028-57b0273c7fac	7e589f4c-041c-4721-8823-937f9a38f058
d0386bb9-accf-4daa-9054-40f1c92788a8	fd519d52-433b-4bf7-8e7d-e18caeccf843	7e589f4c-041c-4721-8823-937f9a38f058
54c9f834-308a-47d9-b65d-2e411143e4f5	f3575bed-7b01-4358-bdf2-3d1f81cc2515	7e589f4c-041c-4721-8823-937f9a38f058
e454f9db-16d2-4cbb-9aa6-deb4bfebfe6a	95465124-34e6-4104-95f7-2f6289016331	7e589f4c-041c-4721-8823-937f9a38f058
1e56ab5b-7d7d-485c-96bd-d672c4c1f8d6	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	7e589f4c-041c-4721-8823-937f9a38f058
3aaa10ff-9a9f-4bf8-9996-ac3af7e778b6	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	7e589f4c-041c-4721-8823-937f9a38f058
ee5c110e-1eb3-405c-988f-8cbb177dbac0	a78272dc-151f-400f-a0b4-1eeec317739c	7e589f4c-041c-4721-8823-937f9a38f058
9cbed9d7-20e7-40d2-a328-913f3b37a288	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	7e589f4c-041c-4721-8823-937f9a38f058
f76d8148-8f87-4bc7-af3b-3027e6d7406f	47d8c413-5440-4d05-90cb-0757217fdfaf	7e589f4c-041c-4721-8823-937f9a38f058
2bde2d93-3ec5-4837-925b-f9b119a3828d	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	7e589f4c-041c-4721-8823-937f9a38f058
2adbd27a-3e43-4a13-ae87-1ec9a00a820f	d1dce1c9-e82b-4efb-8d22-00117a37b94a	7e589f4c-041c-4721-8823-937f9a38f058
fe2af9be-e57d-4d5b-86d3-1a663863deca	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	7e589f4c-041c-4721-8823-937f9a38f058
c49abff3-c0cf-4661-a944-59e762bfa940	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	7e589f4c-041c-4721-8823-937f9a38f058
e297630b-e3ef-459f-b7d2-8d1835148f79	11c8fe77-61a2-4761-b804-46106525f467	7e589f4c-041c-4721-8823-937f9a38f058
1e6e099b-10b0-4121-bf6c-34117f2ed880	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	7e589f4c-041c-4721-8823-937f9a38f058
50f97b91-ff3b-4c46-ba9f-b3ed8d44aea2	504a4c9a-95b7-4872-9db9-78483e3e1e60	7e589f4c-041c-4721-8823-937f9a38f058
d2f33c9c-4321-4a72-a976-73cb3bfbaa16	c827a01f-387c-4c59-bfcd-829297a30a74	7e589f4c-041c-4721-8823-937f9a38f058
0e3a1d94-28f3-4d26-85d2-916b6a755403	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	7e589f4c-041c-4721-8823-937f9a38f058
e08d8d72-a29d-4b60-8657-3293b6647348	e79979e1-326f-4b84-b613-ce32953d1f05	7e589f4c-041c-4721-8823-937f9a38f058
eba57b1c-9cb3-4245-bfc4-98eeae4da403	31743efc-7a80-4efc-957d-dd325851ad8f	87262cba-bbce-4e2b-b9d2-209c81beae55
39c12e84-e8b6-4b5d-b0e3-c250852b8149	39cdd710-8e5b-4a50-9966-f261472dc3c6	87262cba-bbce-4e2b-b9d2-209c81beae55
98f0c527-62a1-4fd0-afe0-2b0062d5e584	5d8be432-3c03-424a-906b-34abbd8f08f0	87262cba-bbce-4e2b-b9d2-209c81beae55
279113e8-153f-44b1-b33a-6bdb8bd9ecca	270c7b2d-c393-485a-9667-02dee4d0403f	87262cba-bbce-4e2b-b9d2-209c81beae55
544d4143-f0f2-4f49-8e1e-9b818fcfb3a1	fa969a8c-dea9-452d-9fe0-e03590643fd0	87262cba-bbce-4e2b-b9d2-209c81beae55
08a4aedf-4b12-47fa-ab66-e18be0c19868	8eb4c043-6391-4c13-adbb-d77ca1c9dc8e	87262cba-bbce-4e2b-b9d2-209c81beae55
033be5e0-5441-4740-aff5-377971b7c571	58c006d6-3e2c-4baf-a1fa-24bab631786a	87262cba-bbce-4e2b-b9d2-209c81beae55
4e31b4ad-2c38-4fde-bdae-904466c08665	b4c659f3-cb6d-4f5f-90ca-e195cde8de00	87262cba-bbce-4e2b-b9d2-209c81beae55
e28d8736-42a5-450d-8ddd-0da5681c111a	ddc2de80-076e-4d20-ad92-7b0ecc067deb	87262cba-bbce-4e2b-b9d2-209c81beae55
5bd6a38f-83f2-4150-920d-80a1d8cf55d8	7b87886d-bc7a-4bee-9368-b52ff2101ab1	87262cba-bbce-4e2b-b9d2-209c81beae55
ef6da95f-89fc-4f4e-b9b4-73cd58b23d9a	fe695664-7f7d-4902-ac11-4abb6e7fd547	87262cba-bbce-4e2b-b9d2-209c81beae55
d9a23992-3fe7-464c-955f-de9abc855acd	42747a4d-181c-4e7e-a215-3d228685873c	87262cba-bbce-4e2b-b9d2-209c81beae55
e04941f9-0692-4af7-9951-ddafdaf9807c	36ceeb1e-a893-431c-9d7a-0b30ae5c9646	87262cba-bbce-4e2b-b9d2-209c81beae55
b3c8c6e0-8e88-41a4-a3a1-b4d08db68140	933c1dd7-ba87-4e5c-a905-a4f0454ec677	87262cba-bbce-4e2b-b9d2-209c81beae55
d6157227-343f-4dce-b35e-d18a65db5151	0e9a2426-af70-4908-947f-c819a14ad377	87262cba-bbce-4e2b-b9d2-209c81beae55
26f02859-85ff-4120-8e83-2097a25a87c3	130e9031-4b46-4ce9-b1fd-6e49462d0cfd	87262cba-bbce-4e2b-b9d2-209c81beae55
0f8b38ee-0e96-44b7-bcec-9290cdf23f01	18f60faa-953f-4d47-b858-8c5d78a9b1ba	87262cba-bbce-4e2b-b9d2-209c81beae55
1c36684d-784f-46fa-9800-5485d0d3689e	7dca393c-e374-4fd4-be89-9a7a9c3f4a00	87262cba-bbce-4e2b-b9d2-209c81beae55
bade7ed2-25d9-4615-a98e-c3ea66d005b0	b28a336c-146e-43d4-af87-dad6f4f98f09	87262cba-bbce-4e2b-b9d2-209c81beae55
c3d8d781-9c5b-48fe-bb2f-7ecd4d8e5214	dc581723-4dbb-48ac-909a-b6854f1d7219	87262cba-bbce-4e2b-b9d2-209c81beae55
f3444aeb-60fc-4266-b8c8-cf4330275d8a	a9b2336c-9cbe-49d1-abd1-fe75a04c87c6	87262cba-bbce-4e2b-b9d2-209c81beae55
94916602-4571-4615-93e7-f22d9f39d872	a448971c-bfff-49f6-a5d1-99dba7ca6172	87262cba-bbce-4e2b-b9d2-209c81beae55
a3dc3fc9-f85d-44d2-8d34-179bcbdcd144	8dd0359b-1da1-41aa-ada0-3342c623c5b4	87262cba-bbce-4e2b-b9d2-209c81beae55
1c321ade-16f5-40c0-835d-6438dbcb03c8	a6a8d329-a29d-41b9-8206-4899ea5c5430	87262cba-bbce-4e2b-b9d2-209c81beae55
7ea80918-d931-45d8-8b81-09c185627058	2925a97c-5364-4fb0-bace-550fdb30f785	87262cba-bbce-4e2b-b9d2-209c81beae55
474d37b1-1017-4810-bcf0-aeade73b457f	ab8d6a3a-8889-442c-996e-15825a25e37f	96a5b59d-82dc-4531-b75c-af15e6f11f0a
66eacb06-f4b5-4772-a780-c0269b5a9b57	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	96a5b59d-82dc-4531-b75c-af15e6f11f0a
a314c391-086e-4ff2-902a-d01953b54870	ae753320-c362-4d8b-8294-53533a1a5798	96a5b59d-82dc-4531-b75c-af15e6f11f0a
f917edb4-42d4-489e-a7b3-089fec6da227	f1719575-4aea-4b3e-a61c-b8307ccf9516	96a5b59d-82dc-4531-b75c-af15e6f11f0a
df4a1e6f-9dac-4b18-b0be-55afca9159af	128691dd-ff65-43d8-8bf4-bb59e2e58617	96a5b59d-82dc-4531-b75c-af15e6f11f0a
4d046d2e-1ee3-45c1-aae9-eb16e8c753ec	65ef7119-ea28-4a7a-9329-fcef962e4343	96a5b59d-82dc-4531-b75c-af15e6f11f0a
3e9593ee-4817-4963-b97c-e3a11194f3e4	c1c97976-38c1-4174-b028-57b0273c7fac	96a5b59d-82dc-4531-b75c-af15e6f11f0a
b4e0b16e-5871-45e9-9608-25f6fb668846	fd519d52-433b-4bf7-8e7d-e18caeccf843	96a5b59d-82dc-4531-b75c-af15e6f11f0a
98193836-33fc-47eb-a558-d6c0ff156e85	f3575bed-7b01-4358-bdf2-3d1f81cc2515	96a5b59d-82dc-4531-b75c-af15e6f11f0a
99d09f4c-71cd-4ac2-905c-15082ea9bf7f	95465124-34e6-4104-95f7-2f6289016331	96a5b59d-82dc-4531-b75c-af15e6f11f0a
db9b2380-a7b6-4ebf-a5ad-342229a65572	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	96a5b59d-82dc-4531-b75c-af15e6f11f0a
f5e51b69-cd11-4e65-8d97-41aeccefd7cb	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	96a5b59d-82dc-4531-b75c-af15e6f11f0a
90e4e245-601f-4bab-98bf-f4cb057dc1e1	a78272dc-151f-400f-a0b4-1eeec317739c	96a5b59d-82dc-4531-b75c-af15e6f11f0a
3732cede-fd00-4cd8-8309-1a8983885ecc	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	96a5b59d-82dc-4531-b75c-af15e6f11f0a
e69aa2af-d0cc-4d76-9ef5-59da5e0f9852	47d8c413-5440-4d05-90cb-0757217fdfaf	96a5b59d-82dc-4531-b75c-af15e6f11f0a
038eee0f-0f10-4098-a99d-b3e7ff5e42ad	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	96a5b59d-82dc-4531-b75c-af15e6f11f0a
3d0cedf9-f500-437b-a4f8-d9cc5baf3464	d1dce1c9-e82b-4efb-8d22-00117a37b94a	96a5b59d-82dc-4531-b75c-af15e6f11f0a
ee306258-3df6-4c93-8349-b48962beecea	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	96a5b59d-82dc-4531-b75c-af15e6f11f0a
ae335052-4098-4113-8726-cedbbd433e23	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	96a5b59d-82dc-4531-b75c-af15e6f11f0a
4b49ad44-06dd-4d8a-8212-87149d7bf8b9	11c8fe77-61a2-4761-b804-46106525f467	96a5b59d-82dc-4531-b75c-af15e6f11f0a
cdf2bf94-82f0-4026-b73d-1cac7f4178d1	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	96a5b59d-82dc-4531-b75c-af15e6f11f0a
8e256ccd-b184-434a-97e8-84635ffcb741	504a4c9a-95b7-4872-9db9-78483e3e1e60	96a5b59d-82dc-4531-b75c-af15e6f11f0a
4fe28fb3-9105-473c-b3d3-179fb955866e	c827a01f-387c-4c59-bfcd-829297a30a74	96a5b59d-82dc-4531-b75c-af15e6f11f0a
dda207af-8cbb-4781-8494-b4d47686a4af	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	96a5b59d-82dc-4531-b75c-af15e6f11f0a
a4112b81-1755-445e-91d3-7b2c3565bd04	e79979e1-326f-4b84-b613-ce32953d1f05	96a5b59d-82dc-4531-b75c-af15e6f11f0a
8563bed4-3ed7-4a5d-b493-a97b64224faf	31743efc-7a80-4efc-957d-dd325851ad8f	9444029c-b31a-42d4-9c3f-d424c58c560c
1ee32257-1fe6-499a-87d5-7a4a0c72fe30	39cdd710-8e5b-4a50-9966-f261472dc3c6	9444029c-b31a-42d4-9c3f-d424c58c560c
c151a372-b8a3-43bc-ab2a-6b52f1e49a48	5d8be432-3c03-424a-906b-34abbd8f08f0	9444029c-b31a-42d4-9c3f-d424c58c560c
30e45fc4-9166-433b-8ce0-b9bec50fe82c	270c7b2d-c393-485a-9667-02dee4d0403f	9444029c-b31a-42d4-9c3f-d424c58c560c
2e9cfd97-34b5-4b28-a3b5-e4350178f043	fa969a8c-dea9-452d-9fe0-e03590643fd0	9444029c-b31a-42d4-9c3f-d424c58c560c
3c4d1feb-6f02-43fe-86f2-2e9b83ff1c7b	8eb4c043-6391-4c13-adbb-d77ca1c9dc8e	9444029c-b31a-42d4-9c3f-d424c58c560c
32fadfbd-1936-443f-9c79-6bfc39974f94	58c006d6-3e2c-4baf-a1fa-24bab631786a	9444029c-b31a-42d4-9c3f-d424c58c560c
7906e1a3-b338-4aa1-9cdc-7bbed1b6c9e7	b4c659f3-cb6d-4f5f-90ca-e195cde8de00	9444029c-b31a-42d4-9c3f-d424c58c560c
bc934d74-0e0d-41ab-b0c7-485d87314db6	ddc2de80-076e-4d20-ad92-7b0ecc067deb	9444029c-b31a-42d4-9c3f-d424c58c560c
698df8be-694c-401a-9c42-6f1486aafb5f	7b87886d-bc7a-4bee-9368-b52ff2101ab1	9444029c-b31a-42d4-9c3f-d424c58c560c
4b906011-cf0c-4d55-8cac-2b1e3b308938	fe695664-7f7d-4902-ac11-4abb6e7fd547	9444029c-b31a-42d4-9c3f-d424c58c560c
205fc358-65a7-4c5d-83c8-cbb5129cece8	42747a4d-181c-4e7e-a215-3d228685873c	9444029c-b31a-42d4-9c3f-d424c58c560c
2f065ed8-8971-4c8a-b5d4-a321e47dc679	36ceeb1e-a893-431c-9d7a-0b30ae5c9646	9444029c-b31a-42d4-9c3f-d424c58c560c
1a71a435-6097-4bad-b3a4-f6d220e9cab5	933c1dd7-ba87-4e5c-a905-a4f0454ec677	9444029c-b31a-42d4-9c3f-d424c58c560c
a2d85ec8-18b2-4e21-84e8-6063c1861253	0e9a2426-af70-4908-947f-c819a14ad377	9444029c-b31a-42d4-9c3f-d424c58c560c
ce8f63b6-4938-47b6-903e-e9bf408e34c8	130e9031-4b46-4ce9-b1fd-6e49462d0cfd	9444029c-b31a-42d4-9c3f-d424c58c560c
48189370-908e-4575-b848-49a172c789a2	18f60faa-953f-4d47-b858-8c5d78a9b1ba	9444029c-b31a-42d4-9c3f-d424c58c560c
de3445b4-eb56-4146-b0f5-ce6268976228	7dca393c-e374-4fd4-be89-9a7a9c3f4a00	9444029c-b31a-42d4-9c3f-d424c58c560c
7135a85a-13db-443d-b52e-b71fc7a936e5	b28a336c-146e-43d4-af87-dad6f4f98f09	9444029c-b31a-42d4-9c3f-d424c58c560c
b6e0fe9a-a0b3-46c0-a351-a13c8f918b36	dc581723-4dbb-48ac-909a-b6854f1d7219	9444029c-b31a-42d4-9c3f-d424c58c560c
ccac9493-a3a3-48b7-b704-cae2b382bc9a	a9b2336c-9cbe-49d1-abd1-fe75a04c87c6	9444029c-b31a-42d4-9c3f-d424c58c560c
ef6bc90f-1b49-4994-8274-c738e3c7e3db	a448971c-bfff-49f6-a5d1-99dba7ca6172	9444029c-b31a-42d4-9c3f-d424c58c560c
6e747d48-0c85-44b4-9dc4-70edc147ed3e	8dd0359b-1da1-41aa-ada0-3342c623c5b4	9444029c-b31a-42d4-9c3f-d424c58c560c
f8cc802a-5c2f-442a-9727-125829b8722a	a6a8d329-a29d-41b9-8206-4899ea5c5430	9444029c-b31a-42d4-9c3f-d424c58c560c
c28c8b16-0052-4fc4-b05e-e95672dff3f5	2925a97c-5364-4fb0-bace-550fdb30f785	9444029c-b31a-42d4-9c3f-d424c58c560c
6d2aa164-0b4d-46ba-83f6-6062410213f2	ab8d6a3a-8889-442c-996e-15825a25e37f	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
261e1e33-cc4a-4ac8-b01d-94f86189b4fc	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
d05a75cd-6ad4-45a0-9941-9e53a52b8de8	ae753320-c362-4d8b-8294-53533a1a5798	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
7243d1c2-30ae-4c10-a044-4149c3910217	f1719575-4aea-4b3e-a61c-b8307ccf9516	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
6af2964f-83e5-4463-9dc7-778eee84753e	128691dd-ff65-43d8-8bf4-bb59e2e58617	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
c491beba-5ec7-4c49-9bf9-46b41634a496	65ef7119-ea28-4a7a-9329-fcef962e4343	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
9da5cfd4-27e9-432e-b696-d5e8a646b32c	c1c97976-38c1-4174-b028-57b0273c7fac	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
fb62fdad-cf02-4e88-84ba-632d1fa05f55	fd519d52-433b-4bf7-8e7d-e18caeccf843	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
3ae7b692-d751-4335-a155-b28a3edc6b0a	f3575bed-7b01-4358-bdf2-3d1f81cc2515	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
10471069-50cf-4d39-93a5-89e12832af74	95465124-34e6-4104-95f7-2f6289016331	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
a66e8613-280f-4dea-b91f-d8ea9059d3ed	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
4ea2cf98-f243-45a8-b36c-af888abd59af	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
d73d9470-0743-4c76-8dc5-682a32625fdb	a78272dc-151f-400f-a0b4-1eeec317739c	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
1584c8a8-4f6a-4087-8c05-7e1486a8322e	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
21ca4427-abc9-4e2d-a914-cf44812fa610	47d8c413-5440-4d05-90cb-0757217fdfaf	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
c9575aa6-284b-4240-9c38-62f748a2048f	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
6db72449-a007-40e2-bc84-8cbce600a590	d1dce1c9-e82b-4efb-8d22-00117a37b94a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
e621d0dd-c22e-4e28-8290-4b7143cd7b0a	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
de6f0cf1-6083-4ef6-ad66-7a20b29fc493	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
fd28abaf-78f3-48bd-a9d1-cc7cf71cc024	11c8fe77-61a2-4761-b804-46106525f467	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
a329fdc5-0823-47d0-a6e8-05f7eb07d1b9	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
f5b4b3c7-432e-46d1-aea1-070faf4e0e10	504a4c9a-95b7-4872-9db9-78483e3e1e60	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
62cb8d16-d74a-44f0-b379-89922c0107b6	c827a01f-387c-4c59-bfcd-829297a30a74	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
4d7fb67a-398a-4f47-9e91-90fcfcccfe0d	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
ff2debfc-1cc4-44fe-bdcd-181416bcdd1b	e79979e1-326f-4b84-b613-ce32953d1f05	4b5e7526-c9f2-4091-9e25-e72f797d7bc9
f333ca3a-414d-4725-845f-90511119d0c9	31743efc-7a80-4efc-957d-dd325851ad8f	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
05d5a414-e97e-464d-a12a-f2e204f93663	39cdd710-8e5b-4a50-9966-f261472dc3c6	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
42b32d7e-4f51-4e9f-98b5-6ca389dcf181	5d8be432-3c03-424a-906b-34abbd8f08f0	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
7595121a-61f2-4ee5-9544-ffe20dc641df	270c7b2d-c393-485a-9667-02dee4d0403f	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
b9409f0f-1a9e-4fb2-afd6-e9a4ee98731a	fa969a8c-dea9-452d-9fe0-e03590643fd0	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
229267ac-4423-4e9a-97dd-daa33c172495	8eb4c043-6391-4c13-adbb-d77ca1c9dc8e	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
5c687ab7-69a0-4d29-b7dc-5ffb9c09c438	58c006d6-3e2c-4baf-a1fa-24bab631786a	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
92ff0ad5-474f-40f7-8739-0429d1bb8775	b4c659f3-cb6d-4f5f-90ca-e195cde8de00	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
4b6babe0-0544-409e-8046-cc9caf0f3114	ddc2de80-076e-4d20-ad92-7b0ecc067deb	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
f03aed5b-d332-4a85-b980-d089d2450779	7b87886d-bc7a-4bee-9368-b52ff2101ab1	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
b5aecf32-3bbe-4531-9e53-273b98f9e039	fe695664-7f7d-4902-ac11-4abb6e7fd547	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
52412d50-4939-4fd2-a7d4-552774d7bae3	42747a4d-181c-4e7e-a215-3d228685873c	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
93c57084-8cf6-4bc2-8986-c143ef0fbce2	36ceeb1e-a893-431c-9d7a-0b30ae5c9646	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
79de5490-a864-46e0-ae3b-7c14fb0bd062	933c1dd7-ba87-4e5c-a905-a4f0454ec677	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
90114a02-baea-41e9-ad9c-ce9145414ddc	0e9a2426-af70-4908-947f-c819a14ad377	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
939d3e21-32d6-47e2-b11e-94f311f1fc85	130e9031-4b46-4ce9-b1fd-6e49462d0cfd	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
43328ddc-40dd-4d04-8b24-243a3befb197	18f60faa-953f-4d47-b858-8c5d78a9b1ba	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
51e051e2-4ba8-4487-8abe-26e4a0e87fcd	7dca393c-e374-4fd4-be89-9a7a9c3f4a00	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
5648fa09-32b4-41e0-bfb7-8996736130a9	b28a336c-146e-43d4-af87-dad6f4f98f09	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
9ba3daf0-d659-4175-b862-c255105eb3c5	dc581723-4dbb-48ac-909a-b6854f1d7219	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
d960bd3b-2e49-4795-bfda-8c1485c29ad9	a9b2336c-9cbe-49d1-abd1-fe75a04c87c6	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
65caf7b0-705b-4876-99d0-f9f2a0be619a	a448971c-bfff-49f6-a5d1-99dba7ca6172	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
379f1373-96e4-4c49-b72e-41ecfdb9b677	8dd0359b-1da1-41aa-ada0-3342c623c5b4	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
e87e2cb1-82ba-4c10-bd80-77978cb0c021	a6a8d329-a29d-41b9-8206-4899ea5c5430	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
0603be97-0afe-4661-882e-1722186f8232	2925a97c-5364-4fb0-bace-550fdb30f785	f611d0bc-8ccc-495f-9d38-da2de66ec8a7
10a48272-1e7a-415c-b5b4-1eab3eccc468	ab8d6a3a-8889-442c-996e-15825a25e37f	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
c50aa1c7-a055-4b5d-8015-743ea5fa73c8	29b02edd-7fe8-4831-81f1-b48c2d7b2d7d	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
d7a217f4-619c-4db3-836c-9cca12eebfc0	ae753320-c362-4d8b-8294-53533a1a5798	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
c290f5a1-19bc-455e-bcbd-f3b78c29f90e	f1719575-4aea-4b3e-a61c-b8307ccf9516	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
4c7e9d23-123d-436c-a871-93613b8fe366	128691dd-ff65-43d8-8bf4-bb59e2e58617	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
d22097e9-ab17-4914-8c5c-c068827b2c44	65ef7119-ea28-4a7a-9329-fcef962e4343	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
c05b7a27-d3d0-40ca-9d4a-c09bdbe770b6	c1c97976-38c1-4174-b028-57b0273c7fac	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
28d31f5d-59a5-4f0a-928a-f3d5bc6bd8d0	fd519d52-433b-4bf7-8e7d-e18caeccf843	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
b71b0f5e-cbb3-473e-8ffb-c62fa32c6331	f3575bed-7b01-4358-bdf2-3d1f81cc2515	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
cae6e2e8-101b-4c64-962a-5cfe3ed83d1f	95465124-34e6-4104-95f7-2f6289016331	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
ede81629-45c9-4332-8df6-3f924dc77671	339504cb-dc37-4d3d-b65d-a79fa3e6b57a	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
37fae0d6-5a74-4611-9f19-d2b1c4d9d85b	80e7906c-5ca1-4abe-8fd0-d8390fab4d3e	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
9d9d2d08-da31-4e90-ae8a-ee9d9d93f577	a78272dc-151f-400f-a0b4-1eeec317739c	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
fc64f9cc-3da6-443e-a8f7-503a841fc784	a97c05b9-4287-4c32-aa0a-bb21f5d7b49a	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
3da750a9-43b5-44cf-a2c2-b7ad4a78259f	47d8c413-5440-4d05-90cb-0757217fdfaf	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
4a047c01-662a-47d6-aa21-87b1f1a1fb5e	0033bc33-ef0a-4f04-a2fd-df6a6f8577ef	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
bf1ee429-374a-4d3f-bd5c-9a3d300eee07	d1dce1c9-e82b-4efb-8d22-00117a37b94a	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
080766a2-1c90-4e34-8391-4856b7a85fbb	bc6a661e-2eaf-4330-bde0-fc493c4d7cae	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
0e2c35b5-9abb-4da8-a6ea-5063b993e8b0	6c8c493d-ebd6-4c7a-bda8-c5d64140f548	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
cd5522ed-9a98-4f9e-8b09-2815b3d3fc84	11c8fe77-61a2-4761-b804-46106525f467	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
bab72f0b-6d0e-45b4-8648-211d002324c7	6be6dea2-284d-48a5-b0ff-3701a1f66e9a	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
f5097a59-635b-40d1-8d6d-b69aa5a4ffee	504a4c9a-95b7-4872-9db9-78483e3e1e60	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
acb0bd22-529a-40be-b904-b60c01989503	c827a01f-387c-4c59-bfcd-829297a30a74	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
21e575ea-b47f-4cdc-9466-738f351f3885	a529c7ec-3f45-4e32-9cc1-5ec243e8c7e5	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
dcf8fb24-9e4f-464f-9c8d-90638ddae62d	e79979e1-326f-4b84-b613-ce32953d1f05	0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e
cebea83a-7606-4c18-9058-7aa88338a6ba	31743efc-7a80-4efc-957d-dd325851ad8f	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
b127638e-b754-4913-b3a7-c83b545347f1	39cdd710-8e5b-4a50-9966-f261472dc3c6	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
76a0b5f3-3498-4a3d-99fe-bba99d993386	5d8be432-3c03-424a-906b-34abbd8f08f0	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
54ecb48b-956c-47d6-8d2c-bc56d5ece2eb	270c7b2d-c393-485a-9667-02dee4d0403f	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
42b63446-8d5d-4848-bbda-16f6dd6b9aee	fa969a8c-dea9-452d-9fe0-e03590643fd0	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
ebd5d087-2a38-40cb-8c04-aaad6ed98be0	8eb4c043-6391-4c13-adbb-d77ca1c9dc8e	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
b98b5154-de42-45c7-86e8-364e53380edb	58c006d6-3e2c-4baf-a1fa-24bab631786a	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
0d6072b3-813f-4366-87d5-13ad1d7ac9df	b4c659f3-cb6d-4f5f-90ca-e195cde8de00	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
de26f7dd-7cc0-4211-a1d1-aa12224038a7	ddc2de80-076e-4d20-ad92-7b0ecc067deb	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
c72e1132-6725-4e00-9c19-7ffc26d1bf39	7b87886d-bc7a-4bee-9368-b52ff2101ab1	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
229b13bc-87d7-4b83-b5a4-58d5826fb38d	fe695664-7f7d-4902-ac11-4abb6e7fd547	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
336c16d2-9d37-42a7-906e-ba35c851484a	42747a4d-181c-4e7e-a215-3d228685873c	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
9bdd4098-d72e-442a-94ee-83b1ea4f4d2a	36ceeb1e-a893-431c-9d7a-0b30ae5c9646	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
44f0f580-7fae-45ce-94dc-607398128742	933c1dd7-ba87-4e5c-a905-a4f0454ec677	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
1f497343-4bf8-4cd9-912c-8b30de4a08d9	0e9a2426-af70-4908-947f-c819a14ad377	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
3d30e485-42d1-4feb-bc12-bd3d54051069	130e9031-4b46-4ce9-b1fd-6e49462d0cfd	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
f5cd1767-2e23-471b-917c-1b0ff38b1149	18f60faa-953f-4d47-b858-8c5d78a9b1ba	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
0f642e3f-8d6d-490f-8c06-685a8b98702a	7dca393c-e374-4fd4-be89-9a7a9c3f4a00	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
3d5c9d4e-7994-4798-be10-0bdcf79af621	b28a336c-146e-43d4-af87-dad6f4f98f09	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
2eae83c6-a298-4543-8c30-dc5c7d8be2bf	dc581723-4dbb-48ac-909a-b6854f1d7219	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
92104cd3-a9dc-4a2a-b65b-f3c0f45bb899	a9b2336c-9cbe-49d1-abd1-fe75a04c87c6	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
a84fd093-40d6-4d6e-9640-186f2a3ee09a	a448971c-bfff-49f6-a5d1-99dba7ca6172	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
b5fddaf5-1ea2-475c-b40c-cdca47b7655e	8dd0359b-1da1-41aa-ada0-3342c623c5b4	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
dee4f648-309d-4c83-898a-ac301c5930a5	a6a8d329-a29d-41b9-8206-4899ea5c5430	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
bd725e2d-33eb-48f6-bba2-3a11e1eb9a80	2925a97c-5364-4fb0-bace-550fdb30f785	29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b
\.


--
-- Data for Name: SubjectOffering; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubjectOffering" (id, "subjectId", "teacherId", year, semester, section, "academicYear") FROM stdin;
7e589f4c-041c-4721-8823-937f9a38f058	259328f9-048d-4c2c-81fd-eefb917748c0	d52301d5-d9a4-4d66-ba12-dead4e77134c	2	3	A	2026-2027
87262cba-bbce-4e2b-b9d2-209c81beae55	259328f9-048d-4c2c-81fd-eefb917748c0	d14d6786-0ed4-4b81-884d-f5c246b26c70	2	3	B	2026-2027
9444029c-b31a-42d4-9c3f-d424c58c560c	a628b1e7-03f6-4054-90eb-81f05a341117	d52301d5-d9a4-4d66-ba12-dead4e77134c	2	3	B	2026-2027
96a5b59d-82dc-4531-b75c-af15e6f11f0a	a628b1e7-03f6-4054-90eb-81f05a341117	39ab55cf-f18a-4dae-87aa-4feaea025a2c	2	3	A	2026-2027
4b5e7526-c9f2-4091-9e25-e72f797d7bc9	7dc85c77-23a0-49e9-bdfb-b06a0f0e4da9	d52301d5-d9a4-4d66-ba12-dead4e77134c	2	3	A	2026-2027
f611d0bc-8ccc-495f-9d38-da2de66ec8a7	7dc85c77-23a0-49e9-bdfb-b06a0f0e4da9	822698d0-3547-4833-a3c7-93f29f45430c	2	3	B	2026-2027
0b2491a4-6e1e-4efd-be1f-4b66b7ab1c0e	440c358d-5e20-46ae-86eb-1fb02903c511	9c4527f4-0139-4c1c-b753-3c5178799cb4	2	3	A	2026-2027
29a789ae-ad2a-4dd0-9c1e-a3fe5003fa5b	440c358d-5e20-46ae-86eb-1fb02903c511	d52301d5-d9a4-4d66-ba12-dead4e77134c	2	3	B	2026-2027
\.


--
-- Data for Name: TeacherAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeacherAttendance" (id, "teacherId", date, month, year, type, status, percentage, "createdAt") FROM stdin;
8183d645-2d23-420a-a5c4-ce6d0ddff70d	822698d0-3547-4833-a3c7-93f29f45430c	2026-03-01 00:00:00	3	2026	DAILY	t	\N	2026-03-08 07:53:07.334
68ed0776-ed51-4d09-bb99-d1784c98bb36	9c4527f4-0139-4c1c-b753-3c5178799cb4	2026-03-01 00:00:00	3	2026	DAILY	f	\N	2026-03-08 07:53:07.343
d9abc534-f0ea-4169-8122-f7dfc9f25183	39ab55cf-f18a-4dae-87aa-4feaea025a2c	2026-03-02 00:00:00	3	2026	DAILY	t	\N	2026-03-08 07:53:07.347
410fbc0c-7c0c-4425-b577-4a558bb7d1a5	822698d0-3547-4833-a3c7-93f29f45430c	2026-03-07 00:00:00	3	2026	DAILY	t	\N	2026-03-08 08:08:18.741
2589e2e1-3fa2-4927-a612-0c118ce08f21	9c4527f4-0139-4c1c-b753-3c5178799cb4	2026-03-07 00:00:00	3	2026	DAILY	f	\N	2026-03-08 08:08:18.75
e2de28ee-2185-4f0c-a2b1-30135f7a16d4	39ab55cf-f18a-4dae-87aa-4feaea025a2c	2026-03-07 00:00:00	3	2026	DAILY	t	\N	2026-03-08 08:08:18.754
274a06f9-f08d-4fc8-ae6d-a2c84dc4deb0	822698d0-3547-4833-a3c7-93f29f45430c	2025-12-31 18:30:00	1	2026	MONTHLY	t	92.5	2026-03-08 08:11:58.391
4d9691ea-7062-45da-bea8-b1adbdee4b33	9c4527f4-0139-4c1c-b753-3c5178799cb4	2025-12-31 18:30:00	1	2026	MONTHLY	t	85	2026-03-08 08:11:58.399
423c3414-a3b9-4118-9976-fbfe2abc00c8	39ab55cf-f18a-4dae-87aa-4feaea025a2c	2025-12-31 18:30:00	1	2026	MONTHLY	t	97	2026-03-08 08:11:58.403
a33257de-2989-4bfd-ab55-22df225df40a	d52301d5-d9a4-4d66-ba12-dead4e77134c	2025-12-31 18:30:00	1	2026	MONTHLY	t	90	2026-03-08 08:19:50.141
c1d0432c-e4ae-4d15-8d68-e62f1243e4e3	822698d0-3547-4833-a3c7-93f29f45430c	2026-02-28 18:30:00	3	2026	MONTHLY	t	92.5	2026-03-08 07:55:01.536
19727d68-7aa8-4e76-9309-f0774d6944bc	9c4527f4-0139-4c1c-b753-3c5178799cb4	2026-02-28 18:30:00	3	2026	MONTHLY	t	85	2026-03-08 07:55:01.545
39bb4beb-e5c4-4778-bf77-d9831a3f3a30	39ab55cf-f18a-4dae-87aa-4feaea025a2c	2026-02-28 18:30:00	3	2026	MONTHLY	t	97	2026-03-08 07:55:01.55
58da6954-fd0b-47fc-8498-e0dc02273f35	d52301d5-d9a4-4d66-ba12-dead4e77134c	2026-02-28 18:30:00	3	2026	MONTHLY	t	50	2026-03-08 08:21:30.006
\.


--
-- Data for Name: TeacherFeedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeacherFeedback" (id, "teacherId", rating, semester, remarks, "createdAt") FROM stdin;
e38a51d0-e04e-4bb1-90e2-b9354def3e2f	39ab55cf-f18a-4dae-87aa-4feaea025a2c	5	sem 1	\N	2026-03-08 08:13:18.155
37e86f67-2deb-4e27-9b8f-93f230d859b0	d52301d5-d9a4-4d66-ba12-dead4e77134c	4	sem2	\N	2026-03-08 08:15:40.922
\.


--
-- Data for Name: TeacherPerformanceData; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeacherPerformanceData" (id, "teacherId", "academicYear", "trainingsCompleted", "trainingDetails", "totalStudents", "passedStudents", "committeesParticipated", "eventsOrganized", "studentsMentored", "adminResponsibilityNotes", "updatedAt") FROM stdin;
94280523-3203-42d6-aed3-43542ba4be39	d52301d5-d9a4-4d66-ba12-dead4e77134c	2025-2026	8	AI, workshops , webinars	150	130	7	2	9	Exam moderator	2026-03-08 08:17:47.959
\.


--
-- Data for Name: TimetableEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TimetableEntry" (id, "departmentId", "dayOfWeek", "startTime", "endTime", "periodNumber", subject, room, "teacherName", "teacherId", "academicYear", year, semester, section, "createdAt", "updatedAt") FROM stdin;
6a7971d6-c2d2-4418-bf9e-e722cde84fb9	f64e716c-0a08-453f-9703-31f51cb8d7da	Monday	07:30	08:30	1	Object Oriented Programming	CR-101	Satvik	d52301d5-d9a4-4d66-ba12-dead4e77134c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
7ed8eb9f-0ef4-4312-a9e2-3b0d81a7d01e	f64e716c-0a08-453f-9703-31f51cb8d7da	Monday	08:30	09:30	2	Mathematics-3	CR-101	Sanika Gadekar	d14d6786-0ed4-4b81-884d-f5c246b26c70	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
5e6cfafc-84bc-45d7-889d-c0c8e9945f1c	f64e716c-0a08-453f-9703-31f51cb8d7da	Monday	09:30	10:30	3	Discrete Structures And Graph Theory	CR-101	Mayank Gaur	39ab55cf-f18a-4dae-87aa-4feaea025a2c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
ed45721f-6e97-4ec0-aa37-3efd975bbe18	f64e716c-0a08-453f-9703-31f51cb8d7da	Monday	10:30	11:30	4	Assembly Language Programming	CR-101	Ankita Deshmukh	822698d0-3547-4833-a3c7-93f29f45430c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
221434ca-dbe5-46dd-ac78-f293c29450f4	f64e716c-0a08-453f-9703-31f51cb8d7da	Tuesday	07:30	08:30	1	Mathematics-3	CR-101	Sanika Gadekar	d14d6786-0ed4-4b81-884d-f5c246b26c70	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
1399d18a-0bb6-419c-aae3-d36487f69248	f64e716c-0a08-453f-9703-31f51cb8d7da	Tuesday	08:30	09:30	2	Assembly Language Programming	CR-101	Ankita Deshmukh	822698d0-3547-4833-a3c7-93f29f45430c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
51cdfd8f-c6ba-491a-8044-38566d1b1e8d	f64e716c-0a08-453f-9703-31f51cb8d7da	Tuesday	09:30	10:30	3	Discrete Structures And Graph Theory	CR-101	Satvik	d52301d5-d9a4-4d66-ba12-dead4e77134c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
932081cf-55ec-4a86-a023-7fc5054f9430	f64e716c-0a08-453f-9703-31f51cb8d7da	Tuesday	10:30	11:30	4	Object Oriented Programming	CR-101	Yash Bakde	9c4527f4-0139-4c1c-b753-3c5178799cb4	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
221ec24f-8eca-44af-b396-1ddf6cd188fc	f64e716c-0a08-453f-9703-31f51cb8d7da	Wednesday	07:30	08:30	1	Discrete Structures And Graph Theory	CR-101	Mayank Gaur	39ab55cf-f18a-4dae-87aa-4feaea025a2c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
cea99608-428d-497c-9247-0a6c67afc5f2	f64e716c-0a08-453f-9703-31f51cb8d7da	Wednesday	08:30	09:30	2	Mathematics-3	CR-101	Satvik	d52301d5-d9a4-4d66-ba12-dead4e77134c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
3554a4a1-7a97-4069-83f5-63e65d25f404	f64e716c-0a08-453f-9703-31f51cb8d7da	Wednesday	09:30	10:30	3	Object Oriented Programming	CR-101	Yash Bakde	9c4527f4-0139-4c1c-b753-3c5178799cb4	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
7725a957-6fa8-4d1a-b88f-830d4db3c333	f64e716c-0a08-453f-9703-31f51cb8d7da	Wednesday	10:30	11:30	4	Assembly Language Programming	CR-101	Satvik	d52301d5-d9a4-4d66-ba12-dead4e77134c	2025-26	2	3	A	2026-03-09 20:01:52.027	2026-03-09 20:01:52.027
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, role, "createdAt", "departmentId", "isBlocked") FROM stdin;
d52301d5-d9a4-4d66-ba12-dead4e77134c	satvik@gmail.com	$2b$10$3QqgLbf75qx0wWHTsrl3beX3cJk6iRNyuLkP.cdMg77KT.5jXsmza	TEACHER	2026-03-01 08:26:02.444	f64e716c-0a08-453f-9703-31f51cb8d7da	f
1979fcda-166b-438a-b2a1-a837d3c4511c	admin@gmail.com	$2b$10$uPDPM9oZWqpTRj3LW6oIk.pEbK/3px.HAVC6tw1t58r2SgsEY.hx6	ADMIN	2026-03-01 13:12:08.112	\N	f
ce7474b5-e7d1-416a-afc2-38ddd95a09f5	satvik23@gmail.com	$2b$10$LHrQs4OLGqt2KCsktAFL1O8JqkmWLKrY8zoZS9NQ.AdhERFRsGVwi	HOD	2026-03-01 14:22:17.27	f64e716c-0a08-453f-9703-31f51cb8d7da	f
d14d6786-0ed4-4b81-884d-f5c246b26c70	sanika@gmail.com	$2b$10$CZrRd76pvbqb1JuqI1yrpu9X/3bgpdNhw.X.xrx4GI6NsMIEI/7H2	TEACHER	2026-03-06 14:48:06.318	f64e716c-0a08-453f-9703-31f51cb8d7da	f
39ab55cf-f18a-4dae-87aa-4feaea025a2c	mayank@gmail.com	$2b$10$23lYr94kuXgqxRcf6rYEWukQybdQZAmBK16Bm1S4RMWMYndgVHNZq	TEACHER	2026-03-06 14:48:35.952	f64e716c-0a08-453f-9703-31f51cb8d7da	f
9c4527f4-0139-4c1c-b753-3c5178799cb4	yash@gmail.com	$2b$10$DzZBhS8J9TL21qai4P8uHu.ZBx3vU1S7A9XBoYG55N2QhCxowmymy	TEACHER	2026-03-06 14:49:08.865	f64e716c-0a08-453f-9703-31f51cb8d7da	f
822698d0-3547-4833-a3c7-93f29f45430c	ankita@gmail.com	$2b$10$XHEGq5zObXOrRX2h05WWBuUwI8vfVr5eV2CF.CQStAs4l4An5k7Nu	TEACHER	2026-03-06 14:49:39.035	f64e716c-0a08-453f-9703-31f51cb8d7da	f
17c7bfc3-ea1a-46a2-a599-91bf9e0f4d9a	principal@gmail.com	$2b$10$hmIAQCbNYWcJMSEmGB8Fx.Qv//7Axreo032HQZmXED6VDdDFIkA5m	PRINCIPAL	2026-03-08 04:44:40.063	\N	f
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
db03c75a-bd67-46b9-afa7-10f398c20347	2f35321abd16fb5c93d414fcfe0c3dc2a755725292da90d0dd13f613cd9801a5	2026-03-01 13:51:03.854394+05:30	20260227171701_init_clean	\N	\N	2026-03-01 13:51:03.707519+05:30	1
c8354425-ac7c-4df7-87aa-4d456eca6e5b	906599fe10e6328e2527065146c853e9a2df63f1914cfbbe37efbbccbddfe55f	2026-03-01 13:51:03.862548+05:30	20260228135242_add_department_shortid_temp	\N	\N	2026-03-01 13:51:03.856035+05:30	1
b40ecea8-0b04-4bf8-9b49-9d53f71f40f5	9dadf526d675e0afd8f0661dc7a39c29e439d25f32e4faf2a14e0a29afacc415	2026-03-01 13:51:03.866613+05:30	20260228140217_add_deptshortid_temp	\N	\N	2026-03-01 13:51:03.863424+05:30	1
ec6a237d-90d9-4fda-8fa5-e4f613938e52	37ff926df3d7dfdf9528a5719f34a26994c4f3f96d6d94872718832ea061c9c8	2026-03-01 13:51:03.871844+05:30	20260228140500_make_deptshortid_required	\N	\N	2026-03-01 13:51:03.867531+05:30	1
061dea3b-e2ca-4576-8781-f645715c82ff	cea3bc19d20b27d7776ac87d535359a3810c1a23d62340b42c3ba4c9705d3f58	2026-03-01 13:51:03.880725+05:30	20260228151402_add_user_department_relation	\N	\N	2026-03-01 13:51:03.87268+05:30	1
91429bde-c1c4-405c-a5c3-63cca667ee62	69462993175b192fc99f537f6c7a174d7e003d188fc4880452fb61beb4271dea	2026-03-01 13:51:12.145472+05:30	20260301082112_academic_schema_update	\N	\N	2026-03-01 13:51:12.070272+05:30	1
d8751088-5d67-41c6-9835-8eb0b079e152	8186cca7fe1edb8ff74741c2d68f7ba5bf2748ef747d5fea311369d1e5417217	2026-03-01 20:21:28.237205+05:30	20260301145128_add_subject_type_and_section_default	\N	\N	2026-03-01 20:21:28.172498+05:30	1
6671c7b8-174a-4093-ac94-89a75dc79cb2	dfc9396b6f6fee6acec2b6bf1b190221f8fcf4cae4a411b98d20dde2f8227465	2026-03-01 22:56:20.594801+05:30	20260301172620_add_class_teacher	\N	\N	2026-03-01 22:56:20.527898+05:30	1
bc74c99e-8043-4420-be67-3a04172fd200	ef218bee6d22ce12dc6de829d6df3bf7dd4bff26c1b8f4733aaf0c6c6188b8bc	2026-03-02 02:34:13.073195+05:30	20260301210413_make_academic_year_optional	\N	\N	2026-03-02 02:34:13.061008+05:30	1
\.


--
-- Name: ActivityEntry ActivityEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityEntry"
    ADD CONSTRAINT "ActivityEntry_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceMonthly AttendanceMonthly_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceMonthly"
    ADD CONSTRAINT "AttendanceMonthly_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceRecord AttendanceRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceRisk AttendanceRisk_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceRisk"
    ADD CONSTRAINT "AttendanceRisk_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceSession AttendanceSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY (id);


--
-- Name: ClassTeacher ClassTeacher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClassTeacher"
    ADD CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: Enrollment Enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY (id);


--
-- Name: FeedbackFormLog FeedbackFormLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FeedbackFormLog"
    ADD CONSTRAINT "FeedbackFormLog_pkey" PRIMARY KEY (id);


--
-- Name: Institute Institute_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Institute"
    ADD CONSTRAINT "Institute_pkey" PRIMARY KEY (id);


--
-- Name: Mark Mark_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mark"
    ADD CONSTRAINT "Mark_pkey" PRIMARY KEY (id);


--
-- Name: Profile Profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: SubjectEnrollment SubjectEnrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubjectEnrollment"
    ADD CONSTRAINT "SubjectEnrollment_pkey" PRIMARY KEY (id);


--
-- Name: SubjectOffering SubjectOffering_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubjectOffering"
    ADD CONSTRAINT "SubjectOffering_pkey" PRIMARY KEY (id);


--
-- Name: Subject Subject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_pkey" PRIMARY KEY (id);


--
-- Name: TeacherAttendance TeacherAttendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherAttendance"
    ADD CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY (id);


--
-- Name: TeacherFeedback TeacherFeedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherFeedback"
    ADD CONSTRAINT "TeacherFeedback_pkey" PRIMARY KEY (id);


--
-- Name: TeacherPerformanceData TeacherPerformanceData_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherPerformanceData"
    ADD CONSTRAINT "TeacherPerformanceData_pkey" PRIMARY KEY (id);


--
-- Name: TimetableEntry TimetableEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ActivityEntry_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActivityEntry_studentId_idx" ON public."ActivityEntry" USING btree ("studentId");


--
-- Name: ActivityEntry_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActivityEntry_teacherId_idx" ON public."ActivityEntry" USING btree ("teacherId");


--
-- Name: AttendanceMonthly_studentId_subjectOfferingId_month_year_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AttendanceMonthly_studentId_subjectOfferingId_month_year_key" ON public."AttendanceMonthly" USING btree ("studentId", "subjectOfferingId", month, year);


--
-- Name: AttendanceMonthly_subjectOfferingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AttendanceMonthly_subjectOfferingId_idx" ON public."AttendanceMonthly" USING btree ("subjectOfferingId");


--
-- Name: AttendanceRecord_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AttendanceRecord_sessionId_idx" ON public."AttendanceRecord" USING btree ("sessionId");


--
-- Name: AttendanceRecord_sessionId_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON public."AttendanceRecord" USING btree ("sessionId", "studentId");


--
-- Name: AttendanceRecord_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AttendanceRecord_studentId_idx" ON public."AttendanceRecord" USING btree ("studentId");


--
-- Name: AttendanceRisk_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AttendanceRisk_studentId_key" ON public."AttendanceRisk" USING btree ("studentId");


--
-- Name: AttendanceSession_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AttendanceSession_date_idx" ON public."AttendanceSession" USING btree (date);


--
-- Name: AttendanceSession_subjectOfferingId_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AttendanceSession_subjectOfferingId_date_key" ON public."AttendanceSession" USING btree ("subjectOfferingId", date);


--
-- Name: ClassTeacher_departmentId_academicYear_year_semester_sectio_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ClassTeacher_departmentId_academicYear_year_semester_sectio_idx" ON public."ClassTeacher" USING btree ("departmentId", "academicYear", year, semester, section);


--
-- Name: ClassTeacher_teacherId_academicYear_year_semester_section_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ClassTeacher_teacherId_academicYear_year_semester_section_key" ON public."ClassTeacher" USING btree ("teacherId", "academicYear", year, semester, section);


--
-- Name: Department_hodId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_hodId_key" ON public."Department" USING btree ("hodId");


--
-- Name: Department_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_name_key" ON public."Department" USING btree (name);


--
-- Name: Department_shortId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_shortId_key" ON public."Department" USING btree ("shortId");


--
-- Name: Enrollment_academicYear_year_semester_section_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Enrollment_academicYear_year_semester_section_idx" ON public."Enrollment" USING btree ("academicYear", year, semester, section);


--
-- Name: Enrollment_studentId_academicYear_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Enrollment_studentId_academicYear_key" ON public."Enrollment" USING btree ("studentId", "academicYear");


--
-- Name: Institute_principalId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Institute_principalId_key" ON public."Institute" USING btree ("principalId");


--
-- Name: Mark_studentId_subjectOfferingId_examType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Mark_studentId_subjectOfferingId_examType_key" ON public."Mark" USING btree ("studentId", "subjectOfferingId", "examType");


--
-- Name: Mark_subjectOfferingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Mark_subjectOfferingId_idx" ON public."Mark" USING btree ("subjectOfferingId");


--
-- Name: Profile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Profile_userId_key" ON public."Profile" USING btree ("userId");


--
-- Name: Student_departmentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Student_departmentId_idx" ON public."Student" USING btree ("departmentId");


--
-- Name: Student_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Student_studentId_key" ON public."Student" USING btree ("studentId");


--
-- Name: SubjectEnrollment_studentId_subjectOfferingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SubjectEnrollment_studentId_subjectOfferingId_key" ON public."SubjectEnrollment" USING btree ("studentId", "subjectOfferingId");


--
-- Name: SubjectEnrollment_subjectOfferingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubjectEnrollment_subjectOfferingId_idx" ON public."SubjectEnrollment" USING btree ("subjectOfferingId");


--
-- Name: SubjectOffering_academicYear_year_semester_section_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubjectOffering_academicYear_year_semester_section_idx" ON public."SubjectOffering" USING btree ("academicYear", year, semester, section);


--
-- Name: SubjectOffering_subjectId_teacherId_academicYear_year_semes_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SubjectOffering_subjectId_teacherId_academicYear_year_semes_key" ON public."SubjectOffering" USING btree ("subjectId", "teacherId", "academicYear", year, semester, section);


--
-- Name: SubjectOffering_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubjectOffering_teacherId_idx" ON public."SubjectOffering" USING btree ("teacherId");


--
-- Name: Subject_name_departmentId_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Subject_name_departmentId_type_key" ON public."Subject" USING btree (name, "departmentId", type);


--
-- Name: TeacherAttendance_teacherId_date_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TeacherAttendance_teacherId_date_type_key" ON public."TeacherAttendance" USING btree ("teacherId", date, type);


--
-- Name: TeacherAttendance_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TeacherAttendance_teacherId_idx" ON public."TeacherAttendance" USING btree ("teacherId");


--
-- Name: TeacherFeedback_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TeacherFeedback_teacherId_idx" ON public."TeacherFeedback" USING btree ("teacherId");


--
-- Name: TeacherPerformanceData_teacherId_academicYear_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TeacherPerformanceData_teacherId_academicYear_key" ON public."TeacherPerformanceData" USING btree ("teacherId", "academicYear");


--
-- Name: TeacherPerformanceData_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TeacherPerformanceData_teacherId_idx" ON public."TeacherPerformanceData" USING btree ("teacherId");


--
-- Name: TimetableEntry_departmentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TimetableEntry_departmentId_idx" ON public."TimetableEntry" USING btree ("departmentId");


--
-- Name: TimetableEntry_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TimetableEntry_teacherId_idx" ON public."TimetableEntry" USING btree ("teacherId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: ActivityEntry ActivityEntry_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityEntry"
    ADD CONSTRAINT "ActivityEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ActivityEntry ActivityEntry_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityEntry"
    ADD CONSTRAINT "ActivityEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceMonthly AttendanceMonthly_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceMonthly"
    ADD CONSTRAINT "AttendanceMonthly_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceMonthly AttendanceMonthly_subjectOfferingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceMonthly"
    ADD CONSTRAINT "AttendanceMonthly_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES public."SubjectOffering"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceRecord AttendanceRecord_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."AttendanceSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceRecord AttendanceRecord_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceRisk AttendanceRisk_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceRisk"
    ADD CONSTRAINT "AttendanceRisk_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceSession AttendanceSession_subjectOfferingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES public."SubjectOffering"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClassTeacher ClassTeacher_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClassTeacher"
    ADD CONSTRAINT "ClassTeacher_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClassTeacher ClassTeacher_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClassTeacher"
    ADD CONSTRAINT "ClassTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_hodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_subjectOfferingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES public."SubjectOffering"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Enrollment Enrollment_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Institute Institute_principalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Institute"
    ADD CONSTRAINT "Institute_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Mark Mark_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mark"
    ADD CONSTRAINT "Mark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mark Mark_subjectOfferingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mark"
    ADD CONSTRAINT "Mark_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES public."SubjectOffering"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Profile Profile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Report Report_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Student Student_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectEnrollment SubjectEnrollment_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubjectEnrollment"
    ADD CONSTRAINT "SubjectEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubjectEnrollment SubjectEnrollment_subjectOfferingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubjectEnrollment"
    ADD CONSTRAINT "SubjectEnrollment_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES public."SubjectOffering"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubjectOffering SubjectOffering_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubjectOffering"
    ADD CONSTRAINT "SubjectOffering_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectOffering SubjectOffering_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubjectOffering"
    ADD CONSTRAINT "SubjectOffering_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Subject Subject_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeacherAttendance TeacherAttendance_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherAttendance"
    ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherFeedback TeacherFeedback_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherFeedback"
    ADD CONSTRAINT "TeacherFeedback_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherPerformanceData TeacherPerformanceData_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherPerformanceData"
    ADD CONSTRAINT "TeacherPerformanceData_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TimetableEntry TimetableEntry_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TimetableEntry TimetableEntry_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

