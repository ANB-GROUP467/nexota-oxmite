import MainLayout from "../layouts/MainLayout";

function Profile() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl p-8">
          <h1 className="text-3xl font-bold">My Profile</h1>

          <div className="mt-8 space-y-4">
            <input placeholder="Name" className="w-full border p-3 rounded" />

            <input placeholder="Email" className="w-full border p-3 rounded" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile;
