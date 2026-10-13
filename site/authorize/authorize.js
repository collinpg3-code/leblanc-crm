// Project & testing authorization: loads the private link's form, tailors it to the
// project type (new website / redesign / security), then signs it.
(function () {
  var API = (location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://leblanc-backend.onrender.com') + '/api/public/authorization/';
  var token = new URLSearchParams(location.search).get('t') || '';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('auth-form');
  var TERMS = {};

  var LEDE = {
    new: "Exciting! We'll build your new website from scratch. This form confirms the project, and lets us security-test your new site before it goes live.",
    redesign: "We'll give your website a fresh start. We check your current site first so we know what to fix and protect, and we test the new one before launch. This form gives us permission to do that.",
    security: "We'll check your website for security problems and fix what you'd like fixed. This form gives us written permission to test your site."
  };

  function show(id, message) {
    ['state-loading', 'state-error', 'auth-form', 'state-done'].forEach(function (s) { $(s).hidden = s !== id; });
    if (message) $(id).textContent = message;
    window.scrollTo(0, 0);
  }

  function projectType() {
    var r = form.querySelector('input[name=projectType]:checked');
    return r ? r.value : '';
  }

  // Show only the sections that fit the chosen project; renumber the steps.
  function applyType() {
    var type = projectType();
    form.querySelectorAll('[data-show]').forEach(function (el) {
      el.hidden = !type || el.getAttribute('data-show').split(' ').indexOf(type) === -1;
    });
    var visible = [].filter.call(form.querySelectorAll('fieldset'), function (f) { return !f.hidden; });
    visible.forEach(function (f, i) { var n = f.querySelector('legend span'); if (n) n.textContent = i + 1; });
    $('lede').textContent = LEDE[type] || 'A quick form so we can get going. It takes about three minutes.';
    renderTerms(TERMS[type] || []);
    $('agree-text').textContent = type === 'new'
      ? "I've read the fine print and I'm authorized to approve this project for the business."
      : "I've read the fine print, and I own these websites or am authorized by the owner to approve this testing.";
  }

  function siteRow(domain, notes) {
    var row = document.createElement('div');
    row.className = 'site-row';
    row.innerHTML =
      '<label>Website<input name="sdomain" maxlength="253" placeholder="example.com" inputmode="url" autocapitalize="none"></label>' +
      '<label><span>Notes <span class="opt">(optional)</span></span><input name="snotes" maxlength="300" placeholder="e.g. skip the staging site"></label>' +
      '<button type="button" class="remove" aria-label="Remove this website">✕</button>';
    row.querySelector('[name=sdomain]').value = domain || '';
    row.querySelector('[name=snotes]').value = notes || '';
    row.querySelector('.remove').addEventListener('click', function () {
      if ($('websites').children.length > 1) row.remove();
      else row.querySelectorAll('input').forEach(function (i) { i.value = ''; });
    });
    $('websites').appendChild(row);
  }

  function renderTerms(terms) {
    var box = $('terms');
    box.innerHTML = '';
    terms.forEach(function (section) {
      var h = document.createElement('h3');
      h.textContent = section.heading;
      box.appendChild(h);
      if (section.text) { var p = document.createElement('p'); p.textContent = section.text; box.appendChild(p); }
      if (section.items) {
        var ul = document.createElement('ul');
        section.items.forEach(function (item) { var li = document.createElement('li'); li.textContent = item; ul.appendChild(li); });
        box.appendChild(ul);
      }
    });
  }

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

  function load() {
    if (!token) return show('state-error', 'This page needs the private link LeBlanc Solutions sent you. Please use that link, or email contact@leblancsols.com.');
    fetch(API + encodeURIComponent(token))
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok) return show('state-error', res.body.error || 'This link could not be opened.');
        var d = res.body;
        TERMS = d.terms || {};
        ['business', 'contactName', 'email', 'phone'].forEach(function (k) { if (d.prefill[k]) form.elements[k].value = d.prefill[k]; });
        (d.prefill.websites.length ? d.prefill.websites : [{}]).forEach(function (w) { siteRow(w.domain, w.notes); });
        var pick = form.querySelector('input[name=projectType][value="' + (d.suggestedType || 'redesign') + '"]');
        if (pick) pick.checked = true;
        selectTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        form.elements.startDate.min = new Date().toISOString().slice(0, 10);
        $('service-line').textContent = d.service ? 'Discussed with Collin: ' + d.service + (d.fee ? ' · $' + d.fee : '') : '';
        applyType();
        show('auth-form');
      })
      .catch(function () {
        show('state-error', 'We could not load your form. Please check your connection and refresh. (Our server can take up to a minute to wake up.)');
      });
  }

  function payload() {
    var e = form.elements;
    var domainPlan = form.querySelector('input[name=domainPlan]:checked');
    return {
      projectType: projectType(),
      business: e.business.value, contactName: e.contactName.value, role: e.role.value,
      email: e.email.value, phone: e.phone.value, goals: e.goals.value,
      websites: Array.prototype.map.call($('websites').children, function (row) {
        return { domain: row.querySelector('[name=sdomain]').value, notes: row.querySelector('[name=snotes]').value };
      }),
      domainPlan: domainPlan ? domainPlan.value : '', domain: e.domain.value,
      active: e.active.checked,
      startDate: e.startDate.value, endDate: e.endDate.value,
      standardHours: e.standardHours.checked, hours: e.hours.value, timeZone: e.timeZone.value,
      signatureName: e.signatureName.value, signatureTitle: e.signatureTitle.value,
      agreeTerms: e.agreeTerms.checked, agreeSignature: e.agreeSignature.checked
    };
  }

  form.addEventListener('change', function (ev) {
    if (ev.target.name === 'projectType') applyType();
    if (ev.target.name === 'domainPlan') $('domain-field').hidden = ev.target.value !== 'have';
    if (ev.target.name === 'standardHours') {
      $('hours-field').hidden = ev.target.checked;
      if (ev.target.checked) form.elements.hours.value = '';
    }
  });
  form.elements.signatureName.addEventListener('input', function () {
    $('signature-preview').textContent = form.elements.signatureName.value;
  });
  $('add-site').addEventListener('click', function () { siteRow(); });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type=submit]');
    button.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Sending…';
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
