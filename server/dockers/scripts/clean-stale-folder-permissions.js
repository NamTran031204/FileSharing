// H10: bao cao va don muc userPermissions cua user khong con la owner/collaborator cua project chua folder.
// Mac dinh chi doc. Ghi that khi co bien moi truong APPLY=1 (can uy quyen, chup mongodump collection folder truoc).
// Chay tu thu muc goc repo:
//   docker exec -i filesharing-mongodb mongosh "<MONGO_URI>" --quiet < server/dockers/scripts/clean-stale-folder-permissions.js
//   docker exec -i -e APPLY=1 filesharing-mongodb mongosh "<MONGO_URI>" --quiet < server/dockers/scripts/clean-stale-folder-permissions.js
const apply = process.env.APPLY === '1';
let totalStale = 0;

db.projects.find({}, { ownerId: 1, 'collaborators.userId': 1 }).forEach(p => {
  const projectId = p._id.toString();
  const allowed = [p.ownerId, ...(p.collaborators || []).map(c => c.userId)].filter(x => x);

  const stale = db.folder.aggregate([
    { $match: { projectId: projectId } },
    { $unwind: '$userPermissions' },
    { $match: { 'userPermissions.userId': { $nin: allowed } } },
    { $group: { _id: '$userPermissions.userId', entries: { $sum: 1 } } }
  ]).toArray();
  if (!stale.length) {
    return;
  }

  const count = stale.reduce((sum, x) => sum + x.entries, 0);
  totalStale += count;
  print(`project ${projectId}: ${count} muc se go, userId: ${stale.map(x => `${x._id}(${x.entries})`).join(', ')}`);

  if (apply) {
    const result = db.folder.updateMany(
      { projectId: projectId, userPermissions: { $elemMatch: { userId: { $nin: allowed } } } },
      { $pull: { userPermissions: { userId: { $nin: allowed } } } }
    );
    print(`  da go: matched=${result.matchedCount} modified=${result.modifiedCount}`);
  }
});

// folder mo coi (project khong ton tai): chi bao, khong sua
const projectIds = db.projects.distinct('_id').map(x => x.toString());
const orphan = db.folder.countDocuments({ projectId: { $nin: projectIds } });
print(`tong muc se go: ${totalStale}; folder mo coi (chi bao): ${orphan}; che do: ${apply ? 'APPLY' : 'chi doc'}`);
