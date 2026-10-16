const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

async function findUserByIdentifier(User, identifier) {
  if (typeof identifier !== 'string' || !identifier.trim()) return null;

  const value = identifier.trim();
  const employee = await User.findOne({ employeeId: value });
  if (employee) return employee;

  if (!OBJECT_ID_PATTERN.test(value)) return null;
  return User.findById(value);
}

module.exports = { findUserByIdentifier };
