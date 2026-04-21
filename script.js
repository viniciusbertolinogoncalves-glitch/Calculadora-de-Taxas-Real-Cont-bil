/* ============================================================
   Real Contábil - Calculadora de Taxas de Cartão
   script.js

   SEÇÕES EDITÁVEIS:
   1. WHATSAPP_URL     -> link do botão do WhatsApp
   2. CONFIG           -> constantes e faixas de faturamento
   3. MAQUININHAS      -> cadastro das maquininhas e planos
   4. Textos dinâmicos -> funções que exibem os resultados
   ============================================================ */


/* ============================================================
   1) LINK DO WHATSAPP
   Substitua o número e a mensagem pelo seu atendimento.
   ============================================================ */
const WHATSAPP_URL =
    "https://wa.me/5511999999999?text=" +
    encodeURIComponent(
        "Olá, Real Contábil! Usei a Calculadora de Taxas e gostaria de um diagnóstico das minhas maquininhas."
    );


/* ============================================================
   2) CONFIGURAÇÕES GERAIS
   Edite aqui as faixas de faturamento e os rótulos exibidos.
   ============================================================ */
const CONFIG = {
    // Faixas de faturamento mensal em cartão. Use [min, max] em reais.
    // "max: Infinity" representa a faixa "acima de 20k", por exemplo.
    faixasFaturamento: {
        ate_2k:     { min: 0,     max: 2000,    label: "até R$ 2.000" },
        de_2k_5k:   { min: 2000,  max: 5000,    label: "R$ 2.000 a R$ 5.000" },
        de_5k_10k:  { min: 5000,  max: 10000,   label: "R$ 5.000 a R$ 10.000" },
        de_10k_20k: { min: 10000, max: 20000,   label: "R$ 10.000 a R$ 20.000" },
        acima_20k:  { min: 20000, max: Infinity, label: "acima de R$ 20.000" },
    },

    // Rótulos exibidos na tabela.
    labels: {
        pessoa:   { PF: "PF", PJ: "PJ", AMBOS: "PF/PJ" },
        bandeira: {
            visa_master: "Visa/Master",
            elo:         "Elo",
            hipercard:   "Hipercard",
            amex:        "Amex",
            outras:      "Demais bandeiras",
            pix:         "Pix",
        },
        prazo: {
            D0:  "Na hora (D+0)",
            D1:  "D+1",
            D14: "14 dias",
            D30: "30 dias",
        },
        venda: {
            debito:            "Débito",
            credito_vista:     "Crédito à vista",
            credito_parcelado: "Crédito parcelado",
            pix:               "Pix / QR Code",
        },
    },
};


/* ============================================================
   3) CADASTRO DE MAQUININHAS E TAXAS
   ------------------------------------------------------------
   Cada objeto representa UM PLANO de UMA maquininha.
   Para incluir uma nova maquininha, copie um bloco e ajuste.

   Campos:
     id             -> identificador único do plano
     marca          -> nome comercial (ex.: "Ton")
     plano          -> nome do plano (ex.: "Ton Ultra")
     pessoa         -> "PF", "PJ" ou "AMBOS"
     faixas         -> array de chaves de CONFIG.faixasFaturamento
                       (ex.: ["de_2k_5k","de_5k_10k"])
     venda          -> array: "debito", "credito_vista",
                       "credito_parcelado", "pix"
     prazos         -> array: "D0","D1","D14","D30"
     bandeiras      -> array: "visa_master","elo","hipercard",
                       "amex","outras","pix"
     parcelas       -> { min, max } para crédito parcelado
     taxas          -> taxas (%) por tipo de venda
                       Para parcelado, use um array taxa[n-1]
                       correspondente à parcela n.
                       (ex.: taxas.credito_parcelado[2] = parcela 3)

   >>> Os valores abaixo são EXEMPLOS didáticos. Atualize com as
       taxas vigentes das adquirentes antes de usar em produção.
   ============================================================ */
const MAQUININHAS = [

    // -------- Ton --------
    {
        id: "ton-pro",
        marca: "Ton",
        plano: "Ton Pro",
        pessoa: "AMBOS",
        faixas: ["ate_2k", "de_2k_5k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D1", "D14", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        1.49,
            credito_vista: 2.99,
            pix:           0.99,
            // Exemplo: 2x=4.99, 3x=5.49, ..., aumenta por parcela
            credito_parcelado: [4.99, 5.49, 5.99, 6.49, 6.99, 7.49, 7.99, 8.49, 8.99, 9.49, 9.99],
        },
    },
    {
        id: "ton-ultra",
        marca: "Ton",
        plano: "Ton Ultra",
        pessoa: "AMBOS",
        faixas: ["de_2k_5k", "de_5k_10k", "de_10k_20k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D1", "D14", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        0.99,
            credito_vista: 1.99,
            pix:           0.50,
            credito_parcelado: [3.99, 4.29, 4.59, 4.89, 5.19, 5.49, 5.79, 6.09, 6.39, 6.69, 6.99],
        },
    },
    {
        id: "ton-black",
        marca: "Ton",
        plano: "Ton Black",
        pessoa: "PJ",
        faixas: ["de_10k_20k", "acima_20k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D0", "D1", "D14", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        0.75,
            credito_vista: 1.59,
            pix:           0.00,
            credito_parcelado: [3.29, 3.59, 3.89, 4.19, 4.49, 4.79, 5.09, 5.39, 5.69, 5.99, 6.29],
        },
    },

    // -------- Mercado Pago --------
    {
        id: "mp-point-mini",
        marca: "Mercado Pago",
        plano: "Point Mini",
        pessoa: "AMBOS",
        faixas: ["ate_2k", "de_2k_5k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D0", "D14", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        1.99,
            credito_vista: 4.98, // D+14
            pix:           0.99,
            credito_parcelado: [5.31, 5.86, 6.41, 6.96, 7.51, 8.06, 8.61, 9.16, 9.71, 10.26, 10.81],
        },
    },
    {
        id: "mp-point-smart",
        marca: "Mercado Pago",
        plano: "Point Smart",
        pessoa: "AMBOS",
        faixas: ["de_2k_5k", "de_5k_10k", "de_10k_20k", "acima_20k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D0", "D1", "D14", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        1.49,
            credito_vista: 3.19,
            pix:           0.49,
            credito_parcelado: [4.69, 5.09, 5.49, 5.89, 6.29, 6.69, 7.09, 7.49, 7.89, 8.29, 8.69],
        },
    },

    // -------- InfinitePay --------
    {
        id: "infinite-nitro",
        marca: "InfinitePay",
        plano: "InfinitePay Nitro",
        pessoa: "AMBOS",
        faixas: ["ate_2k", "de_2k_5k", "de_5k_10k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D1", "D14", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        1.42,
            credito_vista: 3.15,
            pix:           0.00,
            credito_parcelado: [4.50, 4.90, 5.30, 5.70, 6.10, 6.50, 6.90, 7.30, 7.70, 8.10, 8.50],
        },
    },
    {
        id: "infinite-black",
        marca: "InfinitePay",
        plano: "InfiniteBlack",
        pessoa: "PJ",
        faixas: ["de_5k_10k", "de_10k_20k", "acima_20k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D0", "D1", "D14", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        0.99,
            credito_vista: 2.39,
            pix:           0.00,
            credito_parcelado: [3.15, 3.45, 3.75, 4.05, 4.35, 4.65, 4.95, 5.25, 5.55, 5.85, 6.15],
        },
    },

    // -------- PagBank --------
    {
        id: "pag-minizinha",
        marca: "PagBank",
        plano: "Minizinha Chip 3",
        pessoa: "AMBOS",
        faixas: ["ate_2k", "de_2k_5k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D1", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 12 },
        taxas: {
            debito:        1.89,
            credito_vista: 4.19,
            pix:           0.99,
            credito_parcelado: [5.19, 5.69, 6.19, 6.69, 7.19, 7.69, 8.19, 8.69, 9.19, 9.69, 10.19],
        },
    },
    {
        id: "pag-moderninha-x",
        marca: "PagBank",
        plano: "Moderninha X",
        pessoa: "AMBOS",
        faixas: ["de_2k_5k", "de_5k_10k", "de_10k_20k"],
        venda: ["debito", "credito_vista", "credito_parcelado", "pix"],
        prazos: ["D0", "D1", "D30"],
        bandeiras: ["visa_master", "elo", "hipercard", "amex", "outras", "pix"],
        parcelas: { min: 2, max: 18 },
        taxas: {
            debito:        1.59,
            credito_vista: 3.39,
            pix:           0.49,
            credito_parcelado: [4.49, 4.89, 5.29, 5.69, 6.09, 6.49, 6.89, 7.29, 7.69, 8.09, 8.49, 8.89, 9.29, 9.69, 10.09, 10.49, 10.89],
        },
    },

    // ============================================================
    // PARA ADICIONAR UMA NOVA MAQUININHA, COPIE O BLOCO ABAIXO:
    // ============================================================
    // {
    //     id: "ident-unico",
    //     marca: "Nome da Maquininha",
    //     plano: "Nome do Plano",
    //     pessoa: "AMBOS",                  // "PF" | "PJ" | "AMBOS"
    //     faixas: ["de_2k_5k"],             // faixas de faturamento
    //     venda: ["debito","credito_vista","credito_parcelado","pix"],
    //     prazos: ["D1","D30"],
    //     bandeiras: ["visa_master","elo","hipercard","amex","outras","pix"],
    //     parcelas: { min: 2, max: 12 },
    //     taxas: {
    //         debito: 1.99,
    //         credito_vista: 3.49,
    //         pix: 0.99,
    //         credito_parcelado: [4.99, 5.49, ...], // taxa[n-2] = parcela n
    //     },
    // },
];


/* ============================================================
   4) LÓGICA DA APLICAÇÃO
   ============================================================ */

// Helpers
const fmtBRL = (n) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (n) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

function faixaDoFaturamento(faturamento) {
    for (const [chave, faixa] of Object.entries(CONFIG.faixasFaturamento)) {
        if (faturamento >= faixa.min && faturamento < faixa.max) return chave;
    }
    return null;
}

function pessoaAceita(plano, pessoa) {
    return plano.pessoa === "AMBOS" || plano.pessoa === pessoa;
}

function obterTaxa(plano, tipoVenda, parcelas) {
    const t = plano.taxas || {};
    if (tipoVenda === "credito_parcelado") {
        if (!Array.isArray(t.credito_parcelado)) return null;
        // parcela N usa índice N-2 (porque o array começa em 2x)
        const idx = parcelas - 2;
        if (idx < 0 || idx >= t.credito_parcelado.length) return null;
        // valida faixa de parcelas do plano
        if (plano.parcelas) {
            if (parcelas < plano.parcelas.min || parcelas > plano.parcelas.max) return null;
        }
        return t.credito_parcelado[idx];
    }
    if (tipoVenda in t && typeof t[tipoVenda] === "number") {
        return t[tipoVenda];
    }
    return null;
}

function planoAtende(plano, entrada) {
    if (!pessoaAceita(plano, entrada.tipoPessoa)) return false;
    if (!plano.faixas.includes(entrada.faixa)) return false;
    if (!plano.venda.includes(entrada.tipoVenda)) return false;
    if (!plano.prazos.includes(entrada.prazo)) return false;

    // Bandeira: se for pix, exige "pix" entre bandeiras; senão, bandeira explícita ou "outras".
    if (entrada.tipoVenda === "pix") {
        if (!plano.bandeiras.includes("pix")) return false;
    } else {
        const temBandeira =
            plano.bandeiras.includes(entrada.bandeira) ||
            (!["visa_master", "elo", "hipercard", "amex"].includes(entrada.bandeira) &&
                plano.bandeiras.includes("outras"));
        if (!temBandeira) return false;
    }
    return true;
}

function calcular(entrada) {
    const resultados = [];
    for (const plano of MAQUININHAS) {
        if (!planoAtende(plano, entrada)) continue;
        const taxa = obterTaxa(plano, entrada.tipoVenda, entrada.parcelas);
        if (taxa === null) continue;

        const valorTaxa = entrada.valorVenda * (taxa / 100);
        const liquido = entrada.valorVenda - valorTaxa;
        resultados.push({
            plano,
            taxa,
            valorTaxa,
            liquido,
        });
    }

    // Para cada marca, manter apenas o melhor plano (maior líquido).
    const melhorPorMarca = new Map();
    for (const r of resultados) {
        const atual = melhorPorMarca.get(r.plano.marca);
        if (!atual || r.liquido > atual.liquido) {
            melhorPorMarca.set(r.plano.marca, r);
        }
    }

    return [...melhorPorMarca.values()].sort((a, b) => b.liquido - a.liquido);
}


/* ============================================================
   UI: leitura do formulário e renderização
   ============================================================ */

function lerFormulario() {
    const tipoPessoa = document.getElementById("tipoPessoa").value;
    const faturamento = parseFloat(document.getElementById("faturamento").value) || 0;
    const tipoVenda = document.getElementById("tipoVenda").value;
    const valorVenda = parseFloat(document.getElementById("valorVenda").value) || 0;
    const parcelas = parseInt(document.getElementById("parcelas").value, 10) || 1;
    const prazo = document.getElementById("prazo").value;
    const bandeira = document.getElementById("bandeira").value;

    return {
        tipoPessoa,
        faturamento,
        faixa: faixaDoFaturamento(faturamento),
        tipoVenda,
        valorVenda,
        parcelas,
        prazo,
        bandeira,
    };
}

function renderizar(resultados, entrada) {
    const resultsSection = document.getElementById("resultados");
    const emptySection = document.getElementById("semResultados");

    if (!resultados.length) {
        resultsSection.hidden = true;
        emptySection.hidden = false;
        return;
    }
    emptySection.hidden = true;
    resultsSection.hidden = false;

    const melhor = resultados[0];
    const best = document.getElementById("bestOffer");
    best.innerHTML = `
        <h3>Melhor opção para esta venda</h3>
        <p class="best-title">${melhor.plano.marca} — ${melhor.plano.plano}</p>
        <p class="best-value">Você receberia ${fmtBRL(melhor.liquido)} líquido</p>
        <p class="best-meta">
            Taxa de ${fmtPct(melhor.taxa)} · ${fmtBRL(melhor.valorTaxa)} de custo ·
            ${CONFIG.labels.prazo[entrada.prazo]}
        </p>
    `;

    const meta = [
        CONFIG.labels.venda[entrada.tipoVenda],
        entrada.tipoVenda === "credito_parcelado" ? `${entrada.parcelas}x` : null,
        CONFIG.labels.bandeira[entrada.bandeira] || "",
        `Venda de ${fmtBRL(entrada.valorVenda)}`,
        `Faturamento ${CONFIG.faixasFaturamento[entrada.faixa]?.label || ""}`,
    ].filter(Boolean).join(" · ");
    document.getElementById("resultMeta").textContent = meta;

    const tbody = document.getElementById("rankingBody");
    tbody.innerHTML = resultados.map((r, i) => {
        const diff = r.liquido - melhor.liquido; // 0 para o melhor; negativo para demais
        const badgeClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
        const bestRowClass = i === 0 ? "best-row" : "";
        const diffText = i === 0
            ? '<span class="muted">—</span>'
            : `<span style="color:#b91c1c">${fmtBRL(diff)}</span>`;
        const bandeiraLabel = entrada.tipoVenda === "pix"
            ? CONFIG.labels.bandeira.pix
            : CONFIG.labels.bandeira[entrada.bandeira];

        return `
            <tr class="${bestRowClass}">
                <td><span class="rank-badge ${badgeClass}">${i + 1}</span></td>
                <td>
                    <strong>${r.plano.marca}</strong><br>
                    <span class="muted small">${r.plano.plano}</span>
                </td>
                <td>${CONFIG.labels.pessoa[r.plano.pessoa]}</td>
                <td>${bandeiraLabel}</td>
                <td>${CONFIG.labels.prazo[entrada.prazo]}</td>
                <td class="num">${fmtPct(r.taxa)}</td>
                <td class="num">${fmtBRL(r.valorTaxa)}</td>
                <td class="num"><strong>${fmtBRL(r.liquido)}</strong></td>
                <td class="num">${diffText}</td>
            </tr>
        `;
    }).join("");

    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* ============================================================
   Boot
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    // Link do WhatsApp e ano do rodapé
    const wppBtn = document.getElementById("whatsappBtn");
    if (wppBtn) wppBtn.href = WHATSAPP_URL;
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const form = document.getElementById("calc-form");
    const tipoVenda = document.getElementById("tipoVenda");
    const parcelasField = document.getElementById("parcelasField");
    const bandeiraField = document.getElementById("bandeira");

    const ajustarCamposDinamicos = () => {
        const ehParcelado = tipoVenda.value === "credito_parcelado";
        parcelasField.hidden = !ehParcelado;

        // Pix não usa bandeira tradicional
        if (tipoVenda.value === "pix") {
            bandeiraField.value = "outras";
            bandeiraField.disabled = true;
        } else {
            bandeiraField.disabled = false;
        }
    };

    tipoVenda.addEventListener("change", ajustarCamposDinamicos);
    ajustarCamposDinamicos();

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const entrada = lerFormulario();

        if (entrada.valorVenda <= 0) {
            alert("Informe um valor de venda maior que zero.");
            return;
        }
        if (!entrada.faixa) {
            alert("Informe um faturamento válido.");
            return;
        }

        const resultados = calcular(entrada);
        renderizar(resultados, entrada);
    });

    form.addEventListener("reset", () => {
        document.getElementById("resultados").hidden = true;
        document.getElementById("semResultados").hidden = true;
        setTimeout(ajustarCamposDinamicos, 0);
    });
});
