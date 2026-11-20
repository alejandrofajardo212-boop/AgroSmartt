export const SEED_USERS = Object.freeze([
  Object.freeze({
    id: 'e7451962-f36c-4f89-8118-c24ddccd0a8d',
    name: 'Admin AgroSmart',
    email: 'admin@agrosmart.com',
    role: 'Administrador',
    passwordHash: '39e45e9f2b009f83d46962c815014ee41154c05f83a8818aceb7912b21fce030',
    passwordSalt: '729c8e2a62bd72b369e1d7c5f108d807'
  }),
  Object.freeze({
    id: '70c2029b-7a0c-4ed3-87df-84554a9ed735',
    name: 'Diego Fajardo',
    email: 'operario@agrosmart.com',
    role: 'Trabajador / Operario',
    passwordHash: 'a06ce6d64717645df04b32ce73e423bed261e72eb1d50feb62c12ae657a6e0b4',
    passwordSalt: '58c133efa2e4ba084de6fd22b069ff81'
  }),
  Object.freeze({
    id: '5b2cdaf5-f7b8-4708-b9d5-ac804a06fc64',
    name: 'Juan Murillo',
    email: 'agronomo@agrosmart.com',
    role: 'Ingeniero agrónomo / Técnico',
    passwordHash: '5b946a9414f6405fd441e9437d08bf55b689f3f1f440a1e0175ab95c39cbf1cf',
    passwordSalt: 'c3a34589f90f0f9a1ec39e630cbfcd6a'
  }),
  Object.freeze({
    id: 'e35f402f-337f-4280-95a2-f01fc40c837d',
    name: 'Nicolás Galvis',
    email: 'contador@agrosmart.com',
    role: 'Contador / Encargado financiero',
    passwordHash: '43b1604398de6ab90b2faa539a1c80a1209fb4ea263e84e511a5acc93c476e23',
    passwordSalt: 'b0a2df63004021ac42e6e9d1c6699b04'
  })
]);

export const SEED_USER_EMAILS = new Set(SEED_USERS.map((user) => user.email));
