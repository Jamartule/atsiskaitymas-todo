const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const usersFilePath = path.join(__dirname, '../data/users.json');

const readUsers = () => {
  if (!fs.existsSync(usersFilePath)) return [];
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Trūksta duomenų' });

  const users = readUsers();
  const userExists = users.find((u) => u.email === email);
  if (userExists)
    return res.status(400).json({ message: 'El. paštas užimtas' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
  };

  users.push(newUser);
  saveUsers(users);

  res.json({ message: 'Registracija sėkminga' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Trūksta duomenų' });

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: 'Vartotojas nerastas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(400).json({ message: 'Neteisingas slaptažodis' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    'secretkey',
    { expiresIn: '1h' }
  );

  res.json({ token });
};
