// budgetExtra.js
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    var deliveryInput = $("budgetDeliveryTime");
    var validityInput = $("budgetValidity");
    var conditionsInput = $("budgetConditions");

    var deliveryPreview = $("budgetDocDeliveryPreview");
    var validityPreview = $("budgetDocValidityPreview");
    var conditionsBox = $("budgetConditionsPreviewBox");
    var conditionsPreview = $("budgetConditionsPreview");

    function syncDelivery() {
      if (!deliveryPreview) return;
      var text =
        deliveryInput && deliveryInput.value
          ? deliveryInput.value.trim()
          : "";
      deliveryPreview.textContent = text || "–";
    }

    function syncValidity() {
      if (!validityPreview) return;
      var text =
        validityInput && validityInput.value
          ? validityInput.value.trim()
          : "";
      validityPreview.textContent = text || "–";
    }

    function syncConditions() {
      if (!conditionsPreview || !conditionsBox) return;
      var text =
        conditionsInput && conditionsInput.value
          ? conditionsInput.value.trim()
          : "";
      if (!text) {
        conditionsBox.style.display = "none";
        conditionsPreview.textContent = "–";
      } else {
        conditionsBox.style.display = "block";
        conditionsPreview.textContent = text;
      }
    }

    // ---- Plantillas rápidas ----
    function applyPreset(type) {
      if (!deliveryInput || !validityInput || !conditionsInput) return;

      if (type === "standard") {
        deliveryInput.value = "30 a 45 días hábiles desde la aprobación.";
        validityInput.value = "15 días corridos desde la emisión.";
        conditionsInput.value =
          "Precios expresados en moneda local. No incluyen IVA salvo aclaración. " +
          "Condiciones de pago: 50% de anticipo y 50% contra entrega. " +
          "Los plazos de entrega pueden variar según disponibilidad.";
      } else if (type === "contado") {
        deliveryInput.value = "10 a 20 días hábiles desde la acreditación del pago.";
        validityInput.value = "7 días corridos desde la emisión.";
        conditionsInput.value =
          "Precios finales por pago contado/transferencia. No incluyen IVA salvo aclaración. " +
          "El trabajo se agenda una vez acreditado el pago total.";
      } else if (type === "medida") {
        deliveryInput.value = "Plazo a coordinar según alcance del proyecto.";
        validityInput.value = "Presupuesto orientativo, sujeto a relevamiento y ajustes finales.";
        conditionsInput.value =
          "El presente presupuesto corresponde a un proyecto a medida. " +
          "Los valores pueden ajustarse según definición final de materiales, medidas y alcance. " +
          "Se requerirá aprobación de planos y detalles antes de iniciar producción.";
      }

      // Sincronizar vistas
      syncDelivery();
      syncValidity();
      syncConditions();
    }

    if (deliveryInput) {
      deliveryInput.addEventListener("input", syncDelivery);
      syncDelivery();
    }

    if (validityInput) {
      validityInput.addEventListener("input", syncValidity);
      syncValidity();
    }

    if (conditionsInput) {
      conditionsInput.addEventListener("input", syncConditions);
      syncConditions();
    }

    // Listeners de plantillas
    var presetButtons = document.querySelectorAll(
      "[data-conditions-preset]"
    );
    presetButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.getAttribute("data-conditions-preset");
        applyPreset(type);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
