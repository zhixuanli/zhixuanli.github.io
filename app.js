(function () {
  "use strict";

  var publications = [
    {
      title: "ProtoCast: Interpretable Prototype-Conditioned Adaptation for Weather Forecasting",
      authors: "<strong>Zhixuan Li</strong>, Hao Jiang, Chen Hui, Kai Geng, Weisi Lin",
      venue: "arXiv",
      year: "2026",
      role: "lead",
      image: "assets/2026_ProtoCast_thumb.jpg?figure=1",
      imageAlt: "Figure 1. Motivation for local prototype-conditioned forecasting",
      paper: "https://arxiv.org/abs/2611.25848",
      bibtex: "/bibtex/li2026protocast.html",
      project: "/projects/li2026protocast/"
    },
    {
      title: "Shape Distribution Matters: Shape-specific Mixture-of-Experts for Amodal Segmentation under Diverse Occlusions",
      authors: "<strong>Zhixuan Li</strong>, Yujia Liu, Chen Hui, Jeonghaeng Lee, Sanghoon Lee, Weisi Lin",
      venue: "arXiv",
      year: "2025",
      role: "lead",
      image: "assets/2025_ShapeMoE_thumb.jpg",
      paper: "https://arxiv.org/abs/2508.01664",
      bibtex: "/bibtex/li2025shapemoe.html",
      project: "/projects/li2025shapemoe/index.html"
    },
    {
      title: "BEAT: Balanced Frequency Adaptive Tuning for Long-Term Time-Series Forecasting",
      authors: "<strong>Zhixuan Li</strong>, Naipeng Chen, Seonghwa Choi, Sanghoon Lee, Weisi Lin",
      venue: "arXiv",
      year: "2025",
      role: "lead",
      image: "assets/2025_BEAT_thumb.jpg",
      paper: "https://arxiv.org/abs/2501.19065",
      bibtex: "/bibtex/li2025beat.html",
      project: "/projects/li2025beat/index.html"
    },
    {
      title: "Single Point, Full Mask: Velocity-Guided Level Set Evolution for End-to-End Amodal Segmentation",
      authors: "<strong>Zhixuan Li</strong>, Yujia Liu, Chen Hui, Chenyue Song, Weisi Lin",
      venue: "ACM International Conference on Multimedia (ACM MM) · EI · CCF A",
      year: "2026",
      role: "lead",
      image: "assets/2025_VELA_thumb.jpg",
      paper: "https://arxiv.org/abs/2508.01661",
      bibtex: "/bibtex/li2025vela.html",
      project: "/projects/li2025vela/index.html"
    },
    {
      title: "Unveiling the Invisible: Reasoning Complex Occlusions Amodally with AURA",
      authors: "<strong>Zhixuan Li</strong>, Hyunse Yoon, Sanghoon Lee, Weisi Lin",
      venue: "International Conference on Computer Vision (ICCV) · EI · CCF A",
      year: "2025",
      role: "lead",
      image: "assets/2025_AURA_thumb.jpg",
      paper: "https://arxiv.org/abs/2503.10225v2",
      bibtex: "/bibtex/li2025aura.html",
      project: "/projects/li2025aura/index.html"
    },
    {
      title: "BLADE: Box-Level Supervised Amodal Segmentation through Directed Expansion",
      authors: "Zhaochen Liu*, <strong>Zhixuan Li*</strong>, Tingting Jiang <span class=\"equal-contribution\">(* Equal Contribution)</span>",
      venue: "AAAI Conference on Artificial Intelligence (AAAI) · EI · CCF A",
      year: "2024",
      role: "lead",
      image: "assets/2024_AAAI_thumb.jpg",
      paper: "https://arxiv.org/abs/2401.01642",
      bibtex: "/bibtex/liu2024blade.html",
      project: "/projects/liu2024blade/index.html"
    },
    {
      title: "GIN: Generative INvariant Shape Prior for Amodal Instance Segmentation",
      authors: "<strong>Zhixuan Li</strong>, Weining Ye, Tingting Jiang, Tiejun Huang",
      venue: "IEEE Transactions on Multimedia (TMM) · SCI · IF=7.3 · JCR Q1 · CCF B",
      year: "2023",
      role: "lead",
      image: "assets/2023_TMM_thumb.jpg",
      paper: "https://ieeexplore.ieee.org/abstract/document/10258334/",
      bibtex: "/bibtex/li2023gin.html",
      project: "/projects/li2023gin/index.html"
    },
    {
      title: "MUVA: A New Large-Scale Benchmark for Multi-view Amodal Instance Segmentation in the Shopping Scenario",
      authors: "<strong>Zhixuan Li</strong>, Weining Ye, Juan Terven, Zachary Bennett, Ying Zheng, Tingting Jiang, Tiejun Huang",
      venue: "International Conference on Computer Vision (ICCV) · EI · CCF A",
      year: "2023",
      role: "lead",
      image: "assets/2023_ICCV_MUVA_thumb.jpg",
      paper: "https://openaccess.thecvf.com/content/ICCV2023/papers/Li_MUVA_A_New_Large-Scale_Benchmark_for_Multi-View_Amodal_Instance_Segmentation_ICCV_2023_paper.pdf",
      bibtex: "/bibtex/li2023muva.html",
      project: "/projects/li2023muva/index.html"
    },
    {
      title: "OAFormer: Learning Occlusion Distinguishable Feature for Amodal Instance Segmentation",
      authors: "<strong>Zhixuan Li</strong>, Ruohua Shi, Tiejun Huang, Tingting Jiang",
      venue: "IEEE International Conference on Acoustics, Speech and Signal Processing (ICASSP) · EI · CCF B",
      year: "2023",
      role: "lead",
      image: "assets/2023_ICASSP_OAFormer_thumb.jpg",
      paper: "https://ieeexplore.ieee.org/abstract/document/10096534/",
      bibtex: "/bibtex/li2023oaformer.html",
      project: "/projects/li2023oaformer/index.html"
    },
    {
      title: "2D Amodal Instance Segmentation Guided by 3D Shape Prior",
      authors: "<strong>Zhixuan Li</strong>, Weining Ye, Tingting Jiang, Tiejun Huang",
      venue: "European Conference on Computer Vision (ECCV) · EI · CCF B",
      year: "2022",
      role: "lead",
      image: "assets/2022_ECCV_A3D_thumb.jpg",
      paper: "https://link.springer.com/chapter/10.1007/978-3-031-19818-2_10",
      bibtex: "/bibtex/li2022a3d.html",
      project: "/projects/li2022a3d/index.html"
    },
    {
      title: "SEGA: A Transferable Signed Ensemble Gaussian Black-Box Attack against No-Reference Image Quality Assessment Models",
      authors: "Yujia Liu, Dingquan Li, <strong>Zhixuan Li</strong>, Tiejun Huang",
      venue: "IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI) · SCI · JCR Q1 · CCF A",
      year: "2026",
      role: "collaboration",
      image: "assets/2026_TPAMI_SEGA_thumb.jpg",
      paper: "https://ieeexplore.ieee.org/abstract/document/11367453/",
      bibtex: "/bibtex/liu2026sega.html",
      project: "/projects/liu2026sega/index.html"
    },
    {
      title: "Q-CLIP: Unleashing the Power of Vision-Language Models for Video Quality Assessment through Unified Cross-Modal Adaptation",
      authors: "Yachun Mi, Yu Li, Yanting Li, Chen Hui, Tong Zhang, <strong>Zhixuan Li</strong>, Chenyue Song, Wei Yang Bryan Lim, Shaohui Liu",
      venue: "International Conference on Machine Learning (ICML) · CCF A",
      year: "2026",
      role: "collaboration",
      image: "assets/2026_ICML_QCLIP_thumb.jpg",
      paper: "https://arxiv.org/abs/2508.06092",
      bibtex: "/bibtex/mi2026qclip.html",
      project: "/projects/mi2026qclip/index.html"
    },
    {
      title: "DipGuava: Disentangling Personalized Gaussian Features for 3D Head Avatars from Monocular Video",
      authors: "Jeonghaeng Lee, Seok Keun Choi, <strong>Zhixuan Li</strong>, Weisi Lin, Sanghoon Lee",
      venue: "AAAI Conference on Artificial Intelligence (AAAI) · EI · CCF A",
      year: "2026",
      role: "collaboration",
      image: "assets/2026_AAAI_DipGuava_thumb.jpg",
      paper: "https://ojs.aaai.org/index.php/AAAI/article/view/37510",
      bibtex: "/bibtex/lee2025DipGuava.html",
      project: "/projects/lee2026dipguava/index.html"
    },
    {
      title: "UGD-IML: A Unified Generative Diffusion-based Framework for Constrained and Unconstrained Image Manipulation Localization",
      authors: "Yachun Mi, Xingyang He, Shixin Sun, Yu Li, <strong>Zhixuan Li</strong>, Jian Jin, Chen Hui, Shaohui Liu",
      venue: "Neurocomputing · SCI · JCR Q1 · CCF C",
      year: "2026",
      role: "collaboration",
      image: "assets/2026_Neurocomputing_UGDIML_thumb.jpg",
      paper: "https://arxiv.org/abs/2508.06101",
      bibtex: "/bibtex/mi2026ugdiml.html",
      project: "/projects/mi2026ugdiml/index.html"
    },
    {
      title: "LVPNet: A Latent-variable-based Prediction-driven End-to-end Framework for Lossless Compression of Medical Images",
      authors: "Chenyue Song, Chen Hui, Qing Lin, Wei Zhang, Siqiao Li, Shengping Zhang, Haiqi Zhu, <strong>Zhixuan Li</strong>, Shaohui Liu, Feng Jiang, Xiang Li",
      venue: "Medical Image Computing and Computer Assisted Intervention (MICCAI) · EI · CCF B",
      year: "2025",
      role: "collaboration",
      image: "assets/2025_MICCAI_LVPNet_thumb.jpg",
      paper: "https://www.arxiv.org/abs/2506.17983",
      bibtex: "/bibtex/song2025LVPNet.html",
      project: "/projects/song2025lvpnet/index.html"
    },
    {
      title: "MS-IQA: A Multi-Scale Feature Fusion Network for PET/CT Image Quality Assessment",
      authors: "Siqiao Li, Chen Hui, Wei Zhang, Rui Liang, Chenyue Song, Feng Jiang, Haiqi Zhu, <strong>Zhixuan Li</strong>, Hong Huang, Xiang Li",
      venue: "Medical Image Computing and Computer Assisted Intervention (MICCAI) · EI · CCF B",
      year: "2025",
      role: "collaboration",
      image: "assets/2025_MICCAI_MS-IQA_thumb.jpg",
      paper: "https://www.arxiv.org/abs/2506.20200",
      bibtex: "/bibtex/lisiqiao2025MS-IQA.html",
      project: "/projects/li2025msiqa/index.html"
    },
    {
      title: "VIPNet: Combining Viewpoint Information and Shape Priors for Instant Multi-View 3D Reconstruction",
      authors: "Weining Ye, <strong>Zhixuan Li</strong>, Tingting Jiang",
      venue: "Asian Conference on Computer Vision (ACCV) · EI · CCF C",
      year: "2024",
      role: "collaboration",
      image: "assets/2024_ACCV_VIPNet_thumb.jpg",
      paper: "https://openaccess.thecvf.com/content/ACCV2024/html/Ye_VIPNet_Combining_Viewpoint_Information_and_Shape_Priors_for_Instant_Multi-View_ACCV_2024_paper.html",
      bibtex: "/bibtex/ye2024vipnet.html",
      project: "/projects/ye2024vipnet/index.html"
    }
  ];

  var publicationList = document.getElementById("publication-list");
  var publicationStatus = document.getElementById("publication-status");
  var searchInput = document.getElementById("publication-search");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter-button"));
  var activeFilter = "all";
  var publicationRows = new Map();
  var publicationAnimations = [];
  var publicationMotion = matchMedia("(prefers-reduced-motion: reduce)");
  var emptyState = document.createElement("p");
  emptyState.className = "empty-state";
  emptyState.textContent = "No publications match this search.";

  function renderIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function actionLink(label, href, icon) {
    var attributes = href
      ? ' href="' + href + '" target="_blank" rel="noreferrer"'
      : ' role="link" aria-disabled="true"';
    return '<a' + attributes + '><span>' + label +
      '</span><i data-lucide="' + icon + '"></i></a>';
  }

  function getPublicationRow(publication, index) {
    var row = publicationRows.get(publication);
    if (!row) {
      row = document.createElement("article");
      row.className = "publication-row";
      var imageAlt = publication.imageAlt || "Method overview for " + publication.title;
      row.innerHTML =
        '<div class="publication-number"><span></span><span>' + publication.year + '</span></div>' +
        '<img class="publication-thumb" src="' + publication.image + '" alt="' + imageAlt.replace(/"/g, "&quot;") + '">' +
        '<div class="publication-body">' +
          '<h3>' + publication.title + '</h3>' +
          '<p class="publication-authors">' + publication.authors + '</p>' +
          '<p class="publication-venue">' + publication.venue + '</p>' +
        '</div>' +
        '<div class="publication-actions">' +
          actionLink("Paper", publication.paper, "file-text") +
          actionLink("Bibtex", publication.bibtex, "braces") +
          actionLink("Project", publication.project, "panels-top-left") +
        '</div>';
      publicationRows.set(publication, row);
    }

    var number = row.querySelector(".publication-number span");
    var rank = String(index + 1).padStart(2, "0");
    if (number.textContent !== rank) number.textContent = rank;
    return row;
  }

  function visiblePublicationPositions() {
    var positions = new Map();
    Array.from(publicationList.children).forEach(function (row) {
      var bounds = row.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
        positions.set(row, { top: bounds.top, opacity: getComputedStyle(row).opacity });
      }
    });
    return positions;
  }

  function cancelPublicationAnimations() {
    publicationAnimations.forEach(function (animation) { animation.cancel(); });
    publicationAnimations.length = 0;
  }

  function animatePublicationUpdate(previousPositions, duration) {
    var zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    visiblePublicationPositions().forEach(function (position, row) {
      var previous = previousPositions && previousPositions.get(row);
      var offset = previous ? (previous.top - position.top) / zoom : 0;
      var opacity = previous ? Number(previous.opacity) : 0.74;
      if (Math.abs(offset) < 0.5 && opacity === 1) return;

      publicationAnimations.push(row.animate([
        { opacity: opacity, transform: "translateY(" + offset + "px)" },
        { opacity: 1, transform: "none" }
      ], { duration: duration, easing: "cubic-bezier(.22,1,.36,1)" }));
    });
  }

  function renderPublications(animateMoves) {
    var query = searchInput.value.trim().toLowerCase();
    var visible = publications.filter(function (publication) {
      var matchesRole = activeFilter === "all" || publication.role === activeFilter;
      var searchable = [publication.title, publication.venue, publication.year].join(" ").toLowerCase();
      return matchesRole && searchable.indexOf(query) !== -1;
    });

    var rows = visible.length ? visible.map(getPublicationRow) : [emptyState];
    var currentRows = Array.from(publicationList.children);
    if (currentRows.length === rows.length && currentRows.every(function (row, index) {
      return row === rows[index];
    })) return;

    var emptyChanged = currentRows.length > 0 &&
      ((currentRows[0] === emptyState) !== (rows[0] === emptyState));
    var shouldAnimate = !publicationMotion.matches && (animateMoves || emptyChanged);
    // Capture the visible position before cancelling a transition that is still running.
    var previousPositions = shouldAnimate && animateMoves ? visiblePublicationPositions() : null;
    cancelPublicationAnimations();

    var nextRows = new Set(rows);
    currentRows.forEach(function (row) {
      if (!nextRows.has(row)) row.remove();
    });
    rows.forEach(function (row, index) {
      var current = publicationList.children[index];
      if (current !== row) publicationList.insertBefore(row, current || null);
    });
    publicationStatus.textContent = visible.length + " of " + publications.length + " publications";
    renderIcons();

    if (shouldAnimate) animatePublicationUpdate(previousPositions, emptyChanged ? 140 : 210);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (activeFilter === button.dataset.filter) return;
      activeFilter = button.dataset.filter;
      filterButtons.forEach(function (item) {
        var active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderPublications(true);
    });
  });

  searchInput.addEventListener("input", function () {
    renderPublications(false);
  });
  publicationMotion.addEventListener("change", function () {
    if (publicationMotion.matches) cancelPublicationAnimations();
  });

  var themeToggle = document.getElementById("theme-toggle");
  var colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      return localStorage.getItem("zl-theme");
    } catch (error) {
      return null;
    }
  }

  function currentTheme() {
    var stored = storedTheme();
    return stored === "light" || stored === "dark"
      ? stored
      : (colorScheme.matches ? "dark" : "light");
  }

  function updateThemeButton(theme) {
    var next = theme === "dark" ? "light" : "dark";
    var label = "Switch to " + next + " mode";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.innerHTML = '<i data-lucide="' + (theme === "dark" ? "sun" : "moon") + '"></i>';
    document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#11141b" : "#f5f7fb");
    renderIcons();
  }

  themeToggle.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("zl-theme", next);
    } catch (error) {}
    updateThemeButton(next);
  });

  colorScheme.addEventListener("change", function () {
    if (!storedTheme()) {
      document.documentElement.dataset.theme = currentTheme();
      updateThemeButton(currentTheme());
    }
  });

  renderPublications();
  document.documentElement.dataset.theme = currentTheme();
  updateThemeButton(currentTheme());
  renderIcons();
}());
