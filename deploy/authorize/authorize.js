// Online testing authorization: loads the private link's form, then signs it.
(function () {
  var API = (location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://leblanc-backend.onrender.com') + '/api/public/authorization/';
  var token = new URLSearchParams(location.search).get('t') || '';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('auth-form');

  function show(id, message) {
    ['state-loading', 'state-error', 'auth-form', 'state-done'].forEach(function (s) { $(s).hidden = s !== id; });
    if (message) $(id).textContent = message;
    window.scrollTo(0, 0);
  }

  function siteRow(domain, notes) {
    var row = document.createElement('div');
    row.className = 'site-row';
    row.innerHTML =
      '<label>Website<input name="domain" maxlength="253" placeholder="example.com" inputmode="url" autocapitalize="none"></label>' +
      '<label><span>Notes <span class="opt">(optional)</span></span><input name="notes" maxlength="300" placeholder="e.g. skip the staging site"></label>' +
      '<button type="button" class="remove" aria-label="Remove this website">✕</button>';
    row.querySelector('[name=domain]').value = domain || '';
    row.querySelector('[name=notes]').value = notes || '';
    row.querySelector('.remove').addEventListener('click', function () {
      if ($('websites').children.length > 1) row.remove();
      else row.querySelectorAll('input').forEach(function (i) { i.value = ''; });
    });
    $('websites').appendChild(row);
  }

  function renderTerms(terms) {
    var box = $('terms');
    terms.forEach(function (section) {
      var h = document.createElement('h3');
      h.textContent = section.heading;
      box.appendChild(h);
      if (section.text) {
        var p = document.createElement('p');
        p.textContent = section.text;
        box.appendChild(p);
      }
      if (section.items) {
        var ul = document.createElement('ul');
        section.items.forEach(function (item) {
          var li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });
        box.appendChild(ul);
      }
    });
  }

  // Pre-select the visitor's zone; US zones that share rules map to the main option.
  var ZONE_ALIASES = {
    'America/Detroit': 'America/New_York', 'America/Indiana/Indianapolis': 'America/New_York', 'America/Kentucky/Louisville': 'America/New_York', 'America/Toronto': 'America/New_York',
    'America/Menominee': 'America/Chicago', 'America/Indiana/Knox': 'America/Chicago', 'America/Winnipeg': 'America/Chicago',
    'America/Boise': 'America/Denver', 'America/Edmonton': 'America/Denver', 'America/Vancouver': 'America/Los_Angeles'
  };
  function selectTimeZone(zone) {
    var select = form.elements.timeZone;
    zone = ZONE_ALIASES[zone] || zone;
    if (!Array.prototype.some.call(select.options, function (o) { return o.value === zone; })) zone = 'America/New_York';
    select.value = zone;
  }

  function toggleHours() {
    var standard = form.elements.standardHours.checked;
    $('hours-field').hidden = standard;
    if (standard) form.elements.hours.value = '';
  }

  function load() {
    if (!token) return show('state-error', 'This page needs the private link LeBlanc Solutions sent you. Please use that link, or email contact@leblancsols.com.');
    fetch(API + encodeURIComponent(token))
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok) return show('state-error', res.body.error || 'This link could not be opened.');
        var d = res.body;
        Object.keys(d.prefill).forEach(function (k) {
          if (form.elements[k] && typeof d.prefill[k] === 'string') form.elements[k].value = d.prefill[k];
        });
        (d.prefill.websites.length ? d.prefill.websites : [{}]).forEach(function (w) { siteRow(w.domain, w.notes); });
        selectTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        form.elements.startDate.min = new Date().toISOString().slice(0, 10);
        renderTerms(d.terms);
        $('service-line').textContent = 'Service: ' + d.service + (d.fee ? ' · Fee: $' + d.fee : '');
        show('auth-form');
      })
      .catch(function () {
        show('state-error', 'We could not load your form. Please check your connection and refresh. (Our server may take up to a minute to wake up.)');
      });
  }

  function payload() {
    var e = form.elements;
    return {
      business: e.business.value, contactName: e.contactName.value, role: e.role.value,
      email: e.email.value, phone: e.phone.value,
      websites: Array.prototype.map.call($('websites').children, function (row) {
        return { domain: row.querySelector('[name=domain]').value, notes: row.querySelector('[name=notes]').value };
      }),
      recon: e.recon.checked, active: e.active.checked,
      startDate: e.startDate.value, endDate: e.endDate.value,
      standardHours: e.standardHours.checked, hours: e.hours.value, timeZone: e.timeZone.value,
      signatureName: e.signatureName.value, signatureTitle: e.signatureTitle.value,
      agreeTerms: e.agreeTerms.checked, agreeSignature: e.agreeSignature.checked
    };
  }

  form.elements.signatureName.addEventListener('input', function () {
    $('signature-preview').textContent = form.elements.signatureName.value;
  });
  $('add-site').addEventListener('click', function () { siteRow(); });
  form.elements.standardHours.addEventListener('change', toggleHours);

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type=submit]');
    button.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Submitting…';
    fetch(API + encodeURIComponent(token), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload())
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body.error || 'Something went wrong.');
        $('done-time').textContent = 'Signed ' + new Date(res.body.signedAt).toLocaleString();
        show('state-done');
      })
      .catch(function (err) {
        status.className = 'form-status err';
        status.textContent = err.message;
        button.disabled = false;
      });
  });

  load();
})();
