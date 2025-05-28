import { useNavigate } from "@tanstack/react-router";

const submissions = [
  { id: "1", studentName: "John Doe" },
  { id: "2", studentName: "Jane Smith" },
  { id: "3", studentName: "Alice Johnson" },
];

export default function ManualGradeListPage() {
  const navigate = useNavigate();

  const handleClick = (id: string) => {
    navigate({
      to: "/manual-grade/$id",
      params: { id },
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Manual Grading Submissions</h1>
      <ul className="space-y-2">
        {submissions.map((submission) => (
          <li
            key={submission.id}
            onClick={() => handleClick(submission.id)}
            className="cursor-pointer px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition"
          >
            {submission.studentName} (ID: {submission.id})
          </li>
        ))}
      </ul>
    </div>
  );
}
