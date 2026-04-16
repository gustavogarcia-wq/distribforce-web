const fs = require('fs');
let content = fs.readFileSync('src/app/(painel)/vendedores/page.tsx', 'utf8');

// 1. Mudar estado de string para array no form
content = content.replace(
  "nome: '', email: '', senha: '', perfil: 'REPRESENTANTE',\n    telefone: '', estado: 'MG', metaMensal: '', ativo: true,",
  "nome: '', email: '', senha: '', perfil: 'REPRESENTANTE',\n    telefone: '', estados: ['MG'], metaMensal: '', ativo: true,"
);

// 2. Mudar carregamento do form no edit
content = content.replace(
  "estado:     data.vendedor?.regiao?.nome ?? 'MG',",
  "estados:    data.vendedor?.estados?.length ? data.vendedor.estados : [data.vendedor?.regiao?.nome ?? 'MG'],"
);

// 3. Mudar envio para API
content = content.replace(
  "estado:     form.estado,",
  "estados:    form.estados,"
);

// 4. Substituir o select de estado por checkboxes
const oldSelect = `                <div>
                  <label className="label">Estado de atuação *</label>
                  <select className="input" value={form.estado}
                    onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                    <option value="">Selecione</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Verá apenas clientes deste estado</p>
                </div>`;

const newSelect = `                <div className="col-span-2">
                  <label className="label">Estados de atuação *</label>
                  <div className="grid grid-cols-6 gap-2 mt-1">
                    {ESTADOS.map(e => (
                      <label key={e} className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={form.estados.includes(e)}
                          onChange={ev => setForm(p => ({
                            ...p,
                            estados: ev.target.checked
                              ? [...p.estados, e]
                              : p.estados.filter(s => s !== e)
                          }))} />
                        <span className="text-xs text-gray-700">{e}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Verá apenas clientes destes estados</p>
                </div>`;

content = content.replace(oldSelect, newSelect);

// 5. Corrigir validação do botão
content = content.replace(
  "!form.nome || !form.email || (!isEdit && !form.senha) || !form.estado || salvar.isPending",
  "!form.nome || !form.email || (!isEdit && !form.senha) || !form.estados.length || salvar.isPending"
);

fs.writeFileSync('src/app/(painel)/vendedores/page.tsx', content);
console.log('Vendedores atualizado!');
