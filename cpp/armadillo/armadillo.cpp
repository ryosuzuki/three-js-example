extern "C" {
  int main();
  void changeSize(int *n);
  int createZeros();
}

#include <iostream>
#include <armadillo>

using namespace std;
using namespace arma;

void changeSize(int *n) {
  *n = 100;
}

int createZeros() {
  int n = 100;
  mat A = zeros<mat>(n, n);
  mat *p = &A;
  cout << (mat *) p << endl;
  return 0;
}

int main() {
  int n = 10;
  changeSize(&n);
  sp_mat A = zeros<sp_mat>(n, n);
  sp_mat B = zeros<sp_mat>(n, n);
  for (int i =0; i<n; i = i+1) {
    A(i, i) = rand();
    B(i, i) = rand();
  }
  sp_mat C = A*B;
  // cout << C.t() << endl;

  createZeros();
  return 0;
}
