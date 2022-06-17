#!/usr/bin/env python3

import pytest

@pytest.mark.parametrize("arg", [1, 2, 3])
def test_pass(arg):
    assert arg > 0


@pytest.mark.parametrize("arg", [1, 2, 3])
def test_fail(arg):
    assert arg < 0
