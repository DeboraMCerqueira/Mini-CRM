const API_URL = "http://localhost:3000";

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro ao fazer login.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "dashboard.html";
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
      console.error(error);
    }
  });
}

async function carregarClientes() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/customers`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const clientes = await response.json();

    const selectExport = document.getElementById("clienteExportSelect");

    if (selectExport) {
    selectExport.innerHTML = `
    <option value="todos">Todos os clientes</option>
    ${clientes.map(cliente => `
      <option value="${cliente.id}">${cliente.name}</option>
    `).join("")}
  `;
}

    const totalClientes = document.getElementById("totalClientes");
    const clientesLista = document.getElementById("clientesLista");

    totalClientes.textContent = clientes.length;

    if (clientes.length === 0) {
  clientesLista.innerHTML = `
    <div class="empty-state">
      <h3>Nenhum cliente cadastrado ainda</h3>
      <p>Comece adicionando seu primeiro cliente ao CRM.</p>
      <button onclick="mostrarFormularioCliente()">Cadastrar cliente</button>
    </div>
  `;
  return;
}
    clientesLista.innerHTML = clientes.map(cliente => `
  <div class="cliente-card">
    
    <div class="cliente-info">
      <strong>${cliente.name}</strong>
      <span>${cliente.email || '-'}</span>
      <span class="status-badge status-${cliente.status}">
      ${cliente.status}
      </span>
      <span class="visibilidade-badge ${cliente.is_public ? 'publico' : 'privado'}">
      ${cliente.is_public ? '🌍 Público' : '🔒 Privado'}
      </span>
    </div>

    <div class="cliente-actions">
      <button onclick="editarCliente(${cliente.id})">Editar</button>
      <button onclick="excluirCliente(${cliente.id})">Excluir</button>
      <button onclick="abrirHistorico(${cliente.id})">Histórico</button>
    </div>
    <div id="historico-${cliente.id}" class="historico-box"></div>

  </div>
`).join("");

  } catch (error) {
    console.error(error);
    document.getElementById("clientesLista").innerHTML = "Erro ao carregar clientes.";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

if (window.location.pathname.includes("dashboard.html")) {
  carregarClientes();
}

function protegerDashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
  }
}

if (window.location.pathname.includes("dashboard.html")) {
  protegerDashboard();
}

function irDashboard() {
  window.location.href = "dashboard.html";
}

if (window.location.pathname.includes("clientes.html")) {
  protegerDashboard();
  carregarClientes();
}

function destacarMenu() {
  const path = window.location.pathname;

  const links = document.querySelectorAll("nav a");

  links.forEach(link => link.classList.remove("active"));

  if (path.includes("dashboard")) {
    links[0].classList.add("active");
  } else if (path.includes("clientes")) {
    links[1].classList.add("active");
  }
}

destacarMenu();

function mostrarUsuarioLogado() {
  const welcomeMessage = document.getElementById("welcomeMessage");

  if (!welcomeMessage) return;

  const userText = localStorage.getItem("user");

  if (!userText || userText === "undefined") {
    welcomeMessage.textContent = "Bem-vinda ao CRM";
    return;
  }

  try {
    const user = JSON.parse(userText);
    welcomeMessage.textContent = `Bem-vinda, ${user.name}`;
  } catch (error) {
    welcomeMessage.textContent = "Bem-vinda ao CRM";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  mostrarUsuarioLogado();
});

const clienteForm = document.getElementById("clienteForm");

if (clienteForm) {
  clienteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const cliente = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      company: document.getElementById("company").value,
      status: document.getElementById("status").value,
      is_public: document.getElementById("is_public").checked
    };

    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(cliente)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro ao cadastrar cliente");
        return;
      }

      alert("Cliente cadastrado com sucesso!");

      clienteForm.reset();

      carregarClientes(); // atualiza lista automaticamente

    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com servidor");
    }
  });
}
async function excluirCliente(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este cliente?");

  if (!confirmar) return;

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/customers/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Erro ao excluir cliente.");
      return;
    }

    alert("Cliente excluído com sucesso!");
    carregarClientes();

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com servidor.");
  }
}
async function verHistorico(id) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/customers/${id}/interactions`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const historico = await response.json();

    if (!response.ok) {
      alert(historico.message || "Erro ao buscar histórico.");
      return;
    }

    if (historico.length === 0) {
      alert("Este cliente ainda não possui histórico.");
      return;
    }

    const texto = historico.map(item => {
      return `${item.created_at} - ${item.user_name}: ${item.note}`;
    }).join("\n\n");

    alert(texto);

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com servidor.");
  }
}
async function editarCliente(id) {
  const novoStatus = prompt("Novo status: lead, negociacao, fechado ou perdido");

  if (!novoStatus) return;

  const publico = confirm("Este cliente deve ficar público para a equipe?");

  const nome = prompt("Nome do cliente:");
  if (!nome) return;

  const email = prompt("Email do cliente:") || "";
  const phone = prompt("Telefone do cliente:") || "";
  const company = prompt("Empresa:") || "";

  const token = localStorage.getItem("token");

  const clienteAtualizado = {
    name: nome,
    email,
    phone,
    company,
    status: novoStatus,
    is_public: publico
  };

  try {
    const response = await fetch(`${API_URL}/customers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(clienteAtualizado)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Erro ao atualizar cliente.");
      return;
    }

    alert("Cliente atualizado com sucesso!");
    carregarClientes();

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com servidor.");
  }
}
async function carregarRelatorios() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/customers`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const clientes = await response.json();

    console.log("Clientes carregados no relatório:", clientes);

    const selectExport = document.getElementById("clienteExportSelect");

    if (selectExport) {
      selectExport.innerHTML = `<option value="todos">Todos os clientes</option>`;

      clientes.forEach(cliente => {
        const option = document.createElement("option");
        option.value = cliente.id;
        option.textContent = cliente.name;
        selectExport.appendChild(option);
      });
    }

    const total = clientes.length;
    const publicos = clientes.filter(c => c.is_public === 1).length;
    const privados = clientes.filter(c => c.is_public === 0).length;
    const leads = clientes.filter(c => c.status === "lead").length;
    const negociacao = clientes.filter(c => c.status === "negociacao").length;
    const fechados = clientes.filter(c => c.status === "fechado").length;
    const perdidos = clientes.filter(c => c.status === "perdido").length;

    criarGraficoStatus(leads, negociacao, fechados, perdidos);

    if (document.getElementById("relatorioTotalClientes")) {
      document.getElementById("relatorioTotalClientes").textContent = total;
    }

    if (document.getElementById("relatorioPublicos")) {
      document.getElementById("relatorioPublicos").textContent = publicos;
    }

    if (document.getElementById("relatorioPrivados")) {
      document.getElementById("relatorioPrivados").textContent = privados;
    }

    if (document.getElementById("relatorioLeads")) {
      document.getElementById("relatorioLeads").textContent = leads;
    }

    if (document.getElementById("relatorioNegociacao")) {
      document.getElementById("relatorioNegociacao").textContent = negociacao;
    }

    if (document.getElementById("relatorioFechados")) {
      document.getElementById("relatorioFechados").textContent = fechados;
    }

    if (document.getElementById("relatorioPerdidos")) {
      document.getElementById("relatorioPerdidos").textContent = perdidos;
    }

    const resumoTexto = document.getElementById("resumoTexto");

    if (resumoTexto) {
      resumoTexto.textContent =
        `Você possui ${total} cliente(s), sendo ${publicos} público(s) e ${privados} privado(s). ` +
        `No funil: ${leads} lead(s), ${negociacao} em negociação, ${fechados} fechado(s) e ${perdidos} perdido(s).`;
    }

  } catch (error) {
    console.error("Erro ao carregar relatórios:", error);
  }
}

if (window.location.pathname.includes("relatorios.html")) {
  protegerDashboard();
  carregarRelatorios();
}

async function abrirHistorico(id) {
  const box = document.getElementById(`historico-${id}`);
  const token = localStorage.getItem("token");

  // Toggle (abrir/fechar)
  if (box.innerHTML !== "") {
    box.innerHTML = "";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/customers/${id}/interactions`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const historico = await response.json();

    let html = `<div class="historico-conteudo">`;

    if (historico.length === 0) {
      html += `<p>Nenhuma interação ainda.</p>`;
    } else {
      html += historico.map(item => `
        <div class="historico-item">
          <strong>${item.user_name}</strong>
          <span>${formatarData(item.created_at)}</span>
          <p>${item.note}</p>
        </div>
      `).join("");
    }

    html += `
      <textarea id="novaNota-${id}" placeholder="Adicionar observação..."></textarea>
      <button onclick="salvarInteracao(${id})">Salvar</button>
    </div>
    `;

    box.innerHTML = html;

  } catch (error) {
    console.error(error);
    box.innerHTML = "<p>Erro ao carregar histórico</p>";
  }
}

async function salvarInteracao(id) {
  const token = localStorage.getItem("token");
  const textarea = document.getElementById(`novaNota-${id}`);
  const note = textarea.value;

  if (!note) {
    alert("Digite uma observação.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/customers/${id}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ note })
    });

    if (!response.ok) {
      alert("Erro ao salvar observação.");
      return;
    }

    textarea.value = "";
    abrirHistorico(id); // recarrega

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com servidor.");
  }
}

function formatarData(dataSQLite) {
  if (!dataSQLite) return "Sem data";

  const data = new Date(dataSQLite.replace(" ", "T") + "Z");

  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function exportarExcel() {
  const token = localStorage.getItem("token");
  const select = document.getElementById("clienteExportSelect");

const clientesSelecionados = select
  ? Array.from(select.selectedOptions).map(option => option.value)
  : ["todos"];

  try {
    const response = await fetch(`${API_URL}/customers`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    let clientes = await response.json();

    if (!clientesSelecionados.includes("todos")) {
    clientes = clientes.filter(cliente =>
      clientesSelecionados.includes(String(cliente.id))
    );
}

    if (clientes.length === 0) {
      alert("Não há clientes para exportar.");
      return;
    }

    let dados = [];

    for (const cliente of clientes) {
      const resInteracoes = await fetch(`${API_URL}/customers/${cliente.id}/interactions`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const interacoes = await resInteracoes.json();

      if (interacoes.length === 0) {
        dados.push({
          Nome: cliente.name,
          Email: cliente.email || "",
          Telefone: cliente.phone || "",
          Empresa: cliente.company || "",
          Status: cliente.status,
          Visibilidade: cliente.is_public ? "Público" : "Privado",
          Observação: "Sem observações",
          "Data da observação": "",
          Responsável: ""
        });
      } else {
        interacoes.forEach(item => {
          dados.push({
            Nome: cliente.name,
            Email: cliente.email || "",
            Telefone: cliente.phone || "",
            Empresa: cliente.company || "",
            Status: cliente.status,
            Visibilidade: cliente.is_public ? "Público" : "Privado",
            Observação: item.note,
            "Data da observação": formatarData(item.created_at),
            Responsável: item.user_name
          });
        });
      }
    }

    const planilha = XLSX.utils.json_to_sheet(dados);
    const arquivo = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(arquivo, planilha, "Relatório CRM");

    const nomeArquivo = clientesSelecionados.includes("todos")
    ? "relatorio-todos-clientes.xlsx"
    : "relatorio-clientes-selecionados.xlsx";

    XLSX.writeFile(arquivo, nomeArquivo);

  } catch (error) {
    console.error(error);
    alert("Erro ao exportar Excel.");
  }
}

let graficoPizza = null;

function criarGraficoStatus(leads, negociacao, fechados, perdidos) {
  const canvas = document.getElementById("graficoStatus");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (graficoPizza) {
    graficoPizza.destroy();
  }

  graficoPizza = new Chart(ctx, {
    type: "pie",
    data: {
      labels: [
        "Leads",
        "Negociação",
        "Fechados",
        "Perdidos"
      ],
      datasets: [{
        data: [
          leads,
          negociacao,
          fechados,
          perdidos
        ],
        backgroundColor: [
          "#38bdf8",
          "#facc15",
          "#22c55e",
          "#ef4444"
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#ffffff"
          }
        }
      }
    }
  });
}