var points = [
  [55, 175], [62, 175], [66, 171], [89, 232], [96, 223], [154, 335], [205, 70],
  [224, 70], [244, 382], [303, 318], [360, 369], [419, 231], [430, 251],
  [510, 43], [535, 43]
];

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
var nextLetter = 0;

var annotations = [];
var annotationForms = [];

function linearInterpolate(val, min1, max1, min2, max2) {
  return (val - min1) / (max1 - min1) * (max2 - min2) + min2;
}

function graphPointFor(x) {
  // check if we're close to a peak and snap to that
  var nearby = [];
  for (var i = 0; i < points.length; i++) {
    if (Math.abs(points[i][0] - x) < 4) {
      nearby.push(points[i]);
    }
  }
  if (nearby.length > 0) {
    nearby.sort(function(p1, p2) {
      return Math.abs(p1[0] - x) - Math.abs(p2[0] - x);
    });
    return nearby[0];
  }

  // interpolate between the points we're between
  for (var i = 0; i < points.length - 1; i++) {
    if (x >= points[i][0] && x <= points[i + 1][0]) {
      return [
        x,
        linearInterpolate(
            x, points[i][0], points[i + 1][0], points[i][1], points[i + 1][1])
      ];
    }
  }

  return [undefined, undefined];
}

function Annotation(x, y, letter, $cursor) {
  this.x = x;
  this.y = y;
  this.letter = letter;
  this.$cursor = $cursor;
}

function AnnotationForm($form, annotation) {
  this.$form = $form;
  this.annotation = annotation;

  var letterInput = this.$form.find('input');
  letterInput.val(this.annotation.letter);
  letterInput.on('change', function() {
    this.annotation.$cursor.text(letterInput.val());
  }.bind(this));
}
AnnotationForm.prototype = {
  show: function() {
    this.$form.show();
  },
};

function WordCountForm($form) {
  var $input = $form.find('input');
  var $output = $form.find('.output');

  function update() {
    $output.text(Math.round(parseInt($input.val()) / Math.max(annotations.length, 1)));
  }

  $(document.body).on('newannotation', update);
  $input.on('change', update);
}

$(document).on('ready', function() {
  var $graphImage = $('#graph');
  var $overlay0 = $('.graph-overlay-0');

  var $cursor = $('.cursor');
  var $cursorLine = $('.cursor-line');
  var cursorPosition = [undefined, undefined];

  var $annotationDot = $('.annotation-dot');
  var $annotationForm = $('.annotation-form');

  var $wordCountForm = $('.word-count-form');
  new WordCountForm($wordCountForm);

  $graphImage.on('mousemove', function(e) {
    cursorPosition = graphPointFor(e.pageX - $graphImage.offset().left);
    if (cursorPosition[1] !== undefined) {
      $cursor.show().offset({
        left: $graphImage.offset().left + cursorPosition[0] -
            $cursor.outerWidth() / 2,
        top: $graphImage.offset().top +
            (cursorPosition[1] - $cursor.outerHeight() / 2)
      });
      $cursorLine.show().offset({
        left: $graphImage.offset().left + cursorPosition[0],
        top: $graphImage.offset().top
      });
    }
  });

  $graphImage.on('click', function() {
    if (cursorPosition[0] !== undefined && cursorPosition[1] !== undefined) {
      // pick a letter for the annotation
      var letter = letters[nextLetter];
      nextLetter = (nextLetter + 1) % letters.length;

      // create the dot on the graph
      var $dot = $annotationDot.clone().appendTo($overlay0).show();
      $dot.offset({
        left: cursorPosition[0] + $graphImage.offset().left -
            $dot.outerWidth() / 2,
        top: cursorPosition[1] + $graphImage.offset().top -
            $dot.outerHeight() / 2
      });
      $dot.text(letter);

      $dot.draggable({
        drag: function(event, ui) {
          var pt = graphPointFor(ui.position.left - $graphImage.offset().left);
          ui.position.left = pt[0];
          ui.position.top = pt[1];

          cursorPosition = [undefined, undefined];
          $cursor.hide();
          $cursorLine.hide();
        },
      });

      // create the annotation object and its form
      var annotation =
          new Annotation(cursorPosition[0], cursorPosition[1], letter, $dot);
      var form = new AnnotationForm(
          $annotationForm.clone().appendTo(document.body), annotation);
      form.show();
      annotations.push(annotation);
      annotationForms.push(form);

      $(document.body).trigger('newannotation');
    }
  });

  // when mouse goes over a dot, hide the sliding cursor
  $(document.body).on('mouseenter', '.annotation-dot', function() {
    cursorPosition = [undefined, undefined];
    $cursor.hide();
    $cursorLine.hide();
  });
});
