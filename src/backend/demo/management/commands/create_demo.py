# ruff: noqa: S311, S106
"""create_demo management command"""

import logging
import random
import time
from collections import defaultdict

from django import db
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from faker import Faker

from core import models

fake = Faker()

logger = logging.getLogger("impress.commands.demo.create_demo")


def random_true_with_probability(probability):
    """return True with the requested probability, False otherwise."""
    return random.random() < probability


class BulkQueue:
    """A utility class to create Django model instances in bulk by just pushing to a queue."""

    BATCH_SIZE = 20000

    def __init__(self, stdout, *args, **kwargs):
        """Define the queue as a dict of lists."""
        self.queue = defaultdict(list)
        self.stdout = stdout

    def _bulk_create(self, objects):
        """Actually create instances in bulk in the database."""
        if not objects:
            return

        objects[0]._meta.model.objects.bulk_create(objects, ignore_conflicts=False)  # noqa: SLF001
        # In debug mode, Django keeps query cache which creates a memory leak in this case
        db.reset_queries()
        self.queue[objects[0]._meta.model.__name__] = []  # noqa: SLF001

    def push(self, obj):
        """Add a model instance to queue to that it gets created in bulk."""
        objects = self.queue[obj._meta.model.__name__]  # noqa: SLF001
        objects.append(obj)
        if len(objects) > self.BATCH_SIZE:
            self._bulk_create(objects)
            self.stdout.write(".", ending="")

    def flush(self):
        """Flush the queue after creating the remaining model instances."""
        for objects in self.queue.values():
            self._bulk_create(objects)


class Timeit:
    """A utility context manager/method decorator to time execution."""

    total_time = 0

    def __init__(self, stdout, sentence=None):
        """Set the sentence to be displayed for timing information."""
        self.sentence = sentence
        self.start = None
        self.stdout = stdout

    def __call__(self, func):
        """Behavior on call for use as a method decorator."""

        def timeit_wrapper(*args, **kwargs):
            """wrapper to trigger/stop the timer before/after function call."""
            self.__enter__()
            result = func(*args, **kwargs)
            self.__exit__(None, None, None)
            return result

        return timeit_wrapper

    def __enter__(self):
        """Start timer upon entering context manager."""
        self.start = time.perf_counter()
        if self.sentence:
            self.stdout.write(self.sentence, ending=".")

    def __exit__(self, exc_type, exc_value, exc_tb):
        """Stop timer and display result upon leaving context manager."""
        if exc_type is not None:
            raise exc_type(exc_value)
        end = time.perf_counter()
        elapsed_time = end - self.start
        if self.sentence:
            self.stdout.write(f" Took {elapsed_time:g} seconds")

        self.__class__.total_time += elapsed_time
        return elapsed_time


def create_demo(stdout):
    """
    Create a database with demo data for developers to work in a realistic environment.
    The code is engineered to create a huge number of objects fast.
    """

    queue = BulkQueue(stdout)

    with Timeit(stdout, "Creating Template"):
        queue.push(
            models.Template(
                id="472d0633-20b8-4cb1-998a-1134ade092ba",
                title="Demo Template",
                description="This is the demo template",
                code="""
<page size="A4">
  <div class="header">
    <image src="https://upload.wikimedia.org/wikipedia/fr/7/72/Logo_du_Gouvernement_de_la_R%C3%A9publique_fran%C3%A7aise_%282020%29.svg"/>
    <h2 class="header-title">Direction<br/>Interministérielle<br/>du numérique</h2>
  </div>
  <div class="second-row">
    <div class="who-ref">
      <div class="who">La directrice</div>
      <p class="ref">Réf: 1200001</p>
    </div>
    <div class="date">Paris, le 28/09/2023</div>
  </div>
  <div class="third-row">
    <h4 class="title">Note</h4>
    <h5 class="subtitle">à Monsieur le Premier Ministre</h5>
  </div>

  <div class="content">
    <div class="object">Objet: Generated PDF</div>
    <div class="body">{{ body }}</div>
  </div>
</page>
""",         
                css="""
body {
  background: white; 
  font-family: arial
}

img {
  width: 5cm;
  margin-left: -0.4cm;
}

.header {
  display: flex;
  justify-content: space-between;
}

.header-title {
  text-align: right;
  margin-top: 3rem;
  font-size: 1.2rem;
}

.second-row {
  display: flex;
  justify-content: space-between;
  margin-top: 1.2cm;
}

.ref {
  margin-top: 0;
}

.who {
  font-weight: medium;
}

.date, .ref {
  font-size: 12px;
}

.title, .subtitle {
  margin: 0;
}

.subtitle {
  font-weight: normal;
}

.object {
  font-weight: bold;
  margin-bottom: 1.2cm;
  margin-top: 3rem
}
.body{
  margin-top: 1.5rem
}

h1 {
  font-size: 18px;
}

h2 {
  font-size: 14px;
}

p {
  text-align: justify;
  ligne-height: 0.8;
}
""",       
                is_public=True,
            )
        )
        queue.flush()


class Command(BaseCommand):
    """A management command to create a demo database."""

    help = __doc__

    def add_arguments(self, parser):
        """Add argument to require forcing execution when not in debug mode."""
        parser.add_argument(
            "-f",
            "--force",
            action="store_true",
            default=False,
            help="Force command execution despite DEBUG is set to False",
        )

    def handle(self, *args, **options):
        """Handling of the management command."""
        if not settings.DEBUG and not options["force"]:
            raise CommandError(
                (
                    "This command is not meant to be used in production environment "
                    "except you know what you are doing, if so use --force parameter"
                )
            )

        create_demo(self.stdout)
