import AuthShell from "../../components/forms/AuthShell.jsx";
export default function EligibilityInfoPage() {
  return (
    <AuthShell title="Access restricted to healthcare domains">
      <p className="text-gray-700">
        To use this system, sign up or sign in with your work email from an allowed healthcare domain,
        or with an approved email address.
      </p>
      <p className="mt-2 text-gray-600">
        If your organization should be allowed, please contact support to add your domain.
      </p>
    </AuthShell>
  );
}